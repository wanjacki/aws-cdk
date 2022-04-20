import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import { ProductStackSynthesizer } from './private/product-stack-synthesizer';

// keep this import separate from other imports to reduce chance for merge conflicts with v2-main
// eslint-disable-next-line no-duplicate-imports, import/order
import { Construct } from 'constructs';

export class ProductDetail {
  public bucketName?: string;
  public productStackId: string;
  public productName: string;
  public productVersionName: string;
  public productDescription: string;
  public validateTemplate: boolean;
  public overwriteExistingVersion: boolean;

  constructor(productStackId: string) {
    this.productStackId = productStackId;
    this.productName = '';
    this.productVersionName = '';
    this.productDescription = '';
    this.validateTemplate = true;
    this.overwriteExistingVersion = true;
  }

  public getBucketName(): string {
    return cdk.Lazy.uncachedString({ produce: () => this.bucketName });
  }

  public setBucketName(bucketName: string) {
    this.bucketName = bucketName;
  }

  public setProductName(productName: string) {
    this.productName = productName;
  }
  public setProductVersionName(productVersionName: string) {
    this.productVersionName = productVersionName;
  }
  public setProductDescription(productDescription: string) {
    this.productDescription = productDescription;
  }
  public setValidateTemplate(validateTemplate: boolean) {
    this.validateTemplate = validateTemplate;
  }
  public setOverwriteExistingVersion(setOverwriteExistingVersion: boolean) {
    this.overwriteExistingVersion = setOverwriteExistingVersion;
  }
}

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
  private readonly _productDetail: ProductDetail;
  private _templateUrl?: string;
  private _parentStack: cdk.Stack;

  constructor(scope: Construct, id: string) {
    super(scope, id, {
      synthesizer: new ProductStackSynthesizer(),
    });

    this._parentStack = findParentStack(scope);
    this._productDetail = new ProductDetail(id);

    // this is the file name of the synthesized template file within the cloud assembly
    const uniqueId = `${cdk.Names.uniqueId(this)}`;
    this.templateFile = `${uniqueId}.product.template.json`;
  }

  /**
   * Fetch the product details.
   *
   * @internal
   */
  public _getProductDetail(): ProductDetail | undefined {
    return this._productDetail;
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

    const templateAssetParent = this._parentStack.synthesizer.addFileAsset({
      packaging: cdk.FileAssetPackaging.FILE,
      sourceHash: templateHash,
      fileName: this.templateFile,
    });

    this._templateUrl = templateAssetParent.httpUrl;
    this._productDetail.setBucketName(templateAssetParent.bucketName);

    if (this._productDetail.overwriteExistingVersion != false) {
      this.writeToContext(templateHash, this._productDetail);
    }

    fs.writeFileSync(path.join(session.assembly.outdir, this.templateFile), cfn);
  }

  private writeToContext(templateHash: string, productDetail: ProductDetail) {
    const contextFileName = 'cdk.context.json';
    let contextJsonMap = {
      autoVersioningMap: {
        [productDetail.productName]: {
          [productDetail.productStackId]: {
            [productDetail.productVersionName]: {
              templateHash: templateHash,
              description: productDetail.productDescription,
              validateTemplate: productDetail.validateTemplate,
            },
          },
        },
      },
    };
    if (fs.existsSync(contextFileName)) {
      let contextJson = fs.readFileSync(contextFileName);
      contextJsonMap = JSON.parse(contextJson.toString());
      if (contextJsonMap.autoVersioningMap == undefined) {
        contextJsonMap.autoVersioningMap = {
          [productDetail.productName]: {
            [productDetail.productStackId]: {
              [productDetail.productVersionName]: {
                templateHash: templateHash,
                description: productDetail.productDescription,
                validateTemplate: productDetail.validateTemplate,
              },
            },
          },
        };
      } else if (contextJsonMap.autoVersioningMap[productDetail.productName] == undefined) {
        contextJsonMap.autoVersioningMap[productDetail.productName] = {
          [productDetail.productStackId]: {
            [productDetail.productVersionName]: {
              templateHash: templateHash,
              description: productDetail.productDescription,
              validateTemplate: productDetail.validateTemplate,
            },
          },
        };
      } else if (contextJsonMap.autoVersioningMap[productDetail.productName][productDetail.productStackId] == undefined) {
        contextJsonMap.autoVersioningMap[productDetail.productName][productDetail.productStackId] = {
          [productDetail.productVersionName]: {
            templateHash: templateHash,
            description: productDetail.productDescription,
            validateTemplate: productDetail.validateTemplate,
          },
        };
      } else {
        contextJsonMap.autoVersioningMap[productDetail.productName][productDetail.productStackId][productDetail.productVersionName] = {
          templateHash: templateHash,
          description: productDetail.productDescription,
          validateTemplate: productDetail.validateTemplate,
        };
      }
    }
    const contextJsonOutput = JSON.stringify(contextJsonMap);
    fs.writeFileSync('cdk.context.json', contextJsonOutput);
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
