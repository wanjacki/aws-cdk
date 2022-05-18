import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { DEFAULT_PRODUCT_STACK_SNAPSHOT_DIRECTORY, ProductVersionDetails } from './common';
import { ProductStackSynthesizer } from './private/product-stack-synthesizer';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from 'constructs';

/**
 * A Service Catalog product stack, which is similar in form to a Cloudformation nested stack.
 * You can add the resources to this stack that you want to define for your service catalog product.
 *
 * This stack will not be treated as an independent deployment
 * artifact (won't be listed in "cdk list" or deployable through "cdk deploy"),
 * but rather only synthesized as a template and uploaded as an asset to S3.
 *
 */
export class ProductStack extends cdk.Stack {
  public readonly templateFile: string;
  private readonly _productVersionDetails: ProductVersionDetails;
  private _templateUrl?: string;
  private _parentStack: cdk.Stack;

  constructor(scope: Construct, id: string) {
    super(scope, id, {
      synthesizer: new ProductStackSynthesizer(),
    });

    this._parentStack = findParentStack(scope);
    this._productVersionDetails = new ProductVersionDetails();
    this._productVersionDetails.productStackId = id;
    // this is the file name of the synthesized template file within the cloud assembly
    this.templateFile = `${cdk.Names.uniqueId(this)}.product.template.json`;
  }

  /**
   * Fetch the product version details.
   *
   * @internal
   */
  public _getProductVersionDetails(): ProductVersionDetails {
    return this._productVersionDetails;
  }

  /**
   * Fetch the template URL.
   *
   * @internal
   */
  public _getTemplateUrl(): string {
    return cdk.Lazy.uncachedString({ produce: () => this._templateUrl });
  }

  /**
   * Synthesize the product stack template, overrides the `super` class method.
   *
   * Defines an asset at the parent stack which represents the template of this
   * product stack.
   *
   * @internal
   */
  public _synthesizeTemplate(session: cdk.ISynthesisSession): void {
    const cfn = JSON.stringify(this._toCloudFormation(), undefined, 2);
    const templateHash = crypto.createHash('sha256').update(cfn).digest('hex');

    this._templateUrl = this._parentStack.synthesizer.addFileAsset({
      packaging: cdk.FileAssetPackaging.FILE,
      sourceHash: templateHash,
      fileName: this.templateFile,
    }).httpUrl;

    if (this._productVersionDetails.locked !== undefined) {
      this.writeTemplateToSnapshot(cfn);
    }

    fs.writeFileSync(path.join(session.assembly.outdir, this.templateFile), cfn);
  }

  /**
   * Writes current template generated from Product Stack to a snapshot directory.
   *
   * @internal
   */
  private writeTemplateToSnapshot(cfn: string) {
    const productStackSnapshotDirectory = this._productVersionDetails.directory || DEFAULT_PRODUCT_STACK_SNAPSHOT_DIRECTORY;
    if (!fs.existsSync(productStackSnapshotDirectory)) {
      fs.mkdirSync(productStackSnapshotDirectory);
    }
    const templateFileKey = `${this._productVersionDetails.productPathUniqueId}.${this._productVersionDetails.productStackId}.${this._productVersionDetails.productVersionName}.product.template.json`;
    const templateFilePath = path.join(productStackSnapshotDirectory, templateFileKey);
    if (fs.existsSync(templateFilePath)) {
      const previousCfn = fs.readFileSync(templateFilePath).toString();
      if (previousCfn !== cfn && this._productVersionDetails.locked) {
        throw new Error(`Template has changed for ProductStack Version ${this._productVersionDetails.productVersionName}.
        ${this._productVersionDetails.productVersionName} already exist in ${productStackSnapshotDirectory}.
        Since locked has been set to ${this._productVersionDetails.locked},
        Either update the currentVersionName to deploy a new version or deploy the existing ProductStack snapshot.
        If ${this._productVersionDetails.productVersionName} was unintentionally synthesized and not deployed, 
        delete the corresponding version from ${productStackSnapshotDirectory} and redeploy.`);
      }
    }
    fs.writeFileSync(templateFilePath, cfn);
  }
}

/**
 * Validates the scope for a product stack, which must be defined within the scope of another `Stack`.
 */
function findParentStack(scope: Construct): cdk.Stack {
  try {
    const parentStack = cdk.Stack.of(scope);
    return parentStack as cdk.Stack;
  } catch (e) {
    throw new Error('Product stacks must be defined within scope of another non-product stack');
  }
}
