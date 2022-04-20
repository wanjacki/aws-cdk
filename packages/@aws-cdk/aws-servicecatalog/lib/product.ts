import * as fs from 'fs';
import { ArnFormat, IResource, Resource, Stack } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CloudFormationTemplate } from './cloudformation-template';
import { MessageLanguage, TemplateType } from './common';
import { AssociationManager } from './private/association-manager';
import { InputValidator } from './private/validation';
import { ProductDetail } from './product-stack';
import { CfnCloudFormationProduct } from './servicecatalog.generated';
import { TagOptions } from './tag-options';

/**
 * A Service Catalog product, currently only supports type CloudFormationProduct
 */
export interface IProduct extends IResource {
  /**
   * The ARN of the product.
   * @attribute
   */
  readonly productArn: string;

  /**
   * The id of the product
   * @attribute
   */
  readonly productId: string;

  /**
   * Associate Tag Options.
   * A TagOption is a key-value pair managed in AWS Service Catalog.
   * It is not an AWS tag, but serves as a template for creating an AWS tag based on the TagOption.
   */
  associateTagOptions(tagOptions: TagOptions): void;
}

abstract class ProductBase extends Resource implements IProduct {
  public abstract readonly productArn: string;
  public abstract readonly productId: string;

  public associateTagOptions(tagOptions: TagOptions) {
    AssociationManager.associateTagOptions(this, this.productId, tagOptions);
  }
}

/**
 * Properties of product version (also known as a provisioning artifact).
 */
export interface CloudFormationProductVersion {
  /**
   * The description of the product version
   * @default - No description provided
   */
  readonly description?: string;

  /**
   * Whether the specified product template will be validated by CloudFormation.
   * If turned off, an invalid template configuration can be stored.
   * @default true
   */
  readonly validateTemplate?: boolean;

  /**
   * The S3 template that points to the provisioning version template
   */
  readonly cloudFormationTemplate: CloudFormationTemplate;

  /**
   * The name of the product version.
   * @default - No product version name provided
   */
  readonly productVersionName: string;

  /**
   * Additional productVersions to deploy from context file.
   * @default empty
   */

  readonly additionalVersionsFromContext?: string[];

  /**
   * Whether to overwrite existing version in context and deploy.
   * If turned off, changes are only deployed when a new version is set.
   * @default true
   */
  readonly overwriteExistingVersion?: boolean;
}

/**
 * Properties for a Cloudformation Product
 */
export interface CloudFormationProductProps {
  /**
   * The owner of the product.
   */
  readonly owner: string;

  /**
   * The name of the product.
   */
  readonly productName: string;

  /**
   * The configuration of the product version.
   */
  readonly productVersions: CloudFormationProductVersion[];

  /**
   * The language code.
   * Controls language for logging and errors.
   *
   * @default - English
   */
  readonly messageLanguage?: MessageLanguage;

  /**
   * The description of the product.
   * @default - No description provided
   */
  readonly description?: string;

  /**
   * The distributor of the product.
   * @default - No distributor provided
   */
  readonly distributor?: string;

  /**
   * Whether to give provisioning artifacts a new unique identifier when the product attributes or provisioning artifacts is updated
   * @default false
   */
  readonly replaceProductVersionIds?: boolean;

  /**
   * The support information about the product
   * @default - No support description provided
   */
  readonly supportDescription?: string;

  /**
   * The contact email for product support.
   * @default - No support email provided
   */
  readonly supportEmail?: string;

  /**
   * The contact URL for product support.
   * @default - No support URL provided
   */
  readonly supportUrl?: string;

  /**
   * TagOptions associated directly to a product.
   *
   * @default - No tagOptions provided
   */
  readonly tagOptions?: TagOptions;
}

/**
 * Abstract class for Service Catalog Product.
 */
export abstract class Product extends ProductBase {
  /**
   * Creates a Product construct that represents an external product.
   * @param scope The parent creating construct (usually `this`).
   * @param id The construct's name.
   * @param productArn Product Arn
   */
  public static fromProductArn(scope: Construct, id: string, productArn: string): IProduct {
    const arn = Stack.of(scope).splitArn(productArn, ArnFormat.SLASH_RESOURCE_NAME);
    const productId = arn.resourceName;

    if (!productId) {
      throw new Error('Missing required Portfolio ID from Portfolio ARN: ' + productArn);
    }

    return new class extends ProductBase {
      public readonly productId = productId!;
      public readonly productArn = productArn;
    }(scope, id);
  }
}

/**
 * A Service Catalog Cloudformation Product.
 */
export class CloudFormationProduct extends Product {
  public readonly productArn: string;
  public readonly productId: string;

  constructor(scope: Construct, id: string, props: CloudFormationProductProps) {
    super(scope, id);

    this.validateProductProps(props);

    const product = new CfnCloudFormationProduct(this, 'Resource', {
      acceptLanguage: props.messageLanguage,
      description: props.description,
      distributor: props.distributor,
      name: props.productName,
      owner: props.owner,
      provisioningArtifactParameters: this.renderProvisioningArtifacts(props),
      replaceProvisioningArtifacts: props.replaceProductVersionIds,
      supportDescription: props.supportDescription,
      supportEmail: props.supportEmail,
      supportUrl: props.supportUrl,
    });

    this.productId = product.ref;
    this.productArn = Stack.of(this).formatArn({
      service: 'catalog',
      resource: 'product',
      resourceName: product.ref,
    });

    if (props.tagOptions !== undefined) {
      this.associateTagOptions(props.tagOptions);
    }
  }

  private renderProvisioningArtifacts(
    props: CloudFormationProductProps): CfnCloudFormationProduct.ProvisioningArtifactPropertiesProperty[] {
    let productVersions: CfnCloudFormationProduct.ProvisioningArtifactPropertiesProperty[] = [];
    let cachedVersionMap = new Map<string, ProductDetail>();
    let defaultBucketMap = new Map<string, string>();
    let deployedProductVersions = new Set<string>();;
    for (const productVersion of props.productVersions) {
      const template = productVersion.cloudFormationTemplate.bind(this);
      if (template.productDetail != undefined) {
        template.productDetail.setProductName(props.productName);
        template.productDetail.setProductVersionName(productVersion.productVersionName);
      }
      switch (template.templateType) {
        case TemplateType.CONTEXT:
          if (template.productDetail != undefined) {
            cachedVersionMap.set(productVersion.productVersionName, template?.productDetail);
          }
          break;
        case TemplateType.PRODUCT_STACK:
          if (productVersion.description != undefined) {
            template.productDetail?.setProductDescription(productVersion.description);
          }
          if (productVersion.validateTemplate != undefined) {
            template.productDetail?.setValidateTemplate(productVersion.validateTemplate);
          };
          if (template.productDetail?.getBucketName()) {
            defaultBucketMap.set(template.productDetail?.productStackId, template.productDetail?.getBucketName());
          }
          InputValidator.validateUrl(this.node.path, 'provisioning template url', template.httpUrl);
          if (productVersion.overwriteExistingVersion == false
              && template.productDetail !== undefined
              && this.existInContextFile(template.productDetail)) {
            template.productDetail.setOverwriteExistingVersion(productVersion.overwriteExistingVersion);
            cachedVersionMap.set(productVersion.productVersionName, template.productDetail);
          } else {
            productVersions.push(
              {
                name: productVersion.productVersionName,
                description: productVersion.description,
                disableTemplateValidation: productVersion.validateTemplate === false ? true : false,
                info: {
                  LoadTemplateFromURL: template.httpUrl,
                },
              },
            );
            deployedProductVersions.add(productVersion.productVersionName);
          }
          break;
        default:
          InputValidator.validateUrl(this.node.path, 'provisioning template url', template.httpUrl);
          productVersions.push(
            {
              name: productVersion.productVersionName,
              description: productVersion.description,
              disableTemplateValidation: productVersion.validateTemplate === false ? true : false,
              info: {
                LoadTemplateFromURL: template.httpUrl,
              },
            },
          );
          deployedProductVersions.add(productVersion.productVersionName);
      }
    }
    const cachedProductVersions = this.getCachedProductVersions(defaultBucketMap, cachedVersionMap, deployedProductVersions);
    productVersions.push.apply(productVersions, cachedProductVersions);
    return productVersions;
  };

  private getCachedProductVersions(defaultBucketMap: Map<string, string>,
    cachedVersionMap: Map<string, ProductDetail>, deployedProductVersions: Set<string>) :
    CfnCloudFormationProduct.ProvisioningArtifactPropertiesProperty[] {
    let productVersions: CfnCloudFormationProduct.ProvisioningArtifactPropertiesProperty[] = [];
    const contextFileName = 'cdk.context.json';
    if (fs.existsSync(contextFileName)) {
      const contextJson = fs.readFileSync(contextFileName);
      const contextJsonMap = JSON.parse(contextJson.toString());
      if (contextJsonMap.autoVersioningMap == undefined) {
        return productVersions;
      }
      for (let [productVersionName, productDetail] of cachedVersionMap) {
        if (!defaultBucketMap.has(productDetail.productStackId)) {
          throw new Error (`No base ProductStack found for ${productDetail.productStackId}`);
        }
        if (deployedProductVersions.has(productVersionName)) {
          throw new Error (`Duplicate product version found for ${productVersionName}`);
        }
        // let assetBucketName = cdk.DefaultStackSynthesizer.DEFAULT_FILE_ASSETS_BUCKET_NAME;
        // assetBucketName = assetBucketName.replace(/\${AWS::AccountId}/g, cdk.Stack.of(this).account);
        // assetBucketName = assetBucketName.replace(/\${AWS::Region}/g, cdk.Stack.of(this).region);
        // assetBucketName = assetBucketName.replace(/\${Qualifier}/g, cdk.DefaultStackSynthesizer.DEFAULT_QUALIFIER);
        // if (productVersionName == productVersion.productVersionName) {
        //   throw new Error(`Base Product Version ${productVersionName} found in additionalVersionsFromContext`);
        // }
        if (contextJsonMap.autoVersioningMap[productDetail.productName][productDetail.productStackId][productVersionName] == undefined) {
          throw new Error(`Product Version ${productVersionName} not found in context`);
        }
        const productDetails = contextJsonMap.autoVersioningMap[productDetail.productName][productDetail.productStackId][productVersionName];
        const httpUrl = `https://${defaultBucketMap.get(productDetail.productStackId)}.s3.amazonaws.com/assets/${productDetails.templateHash}.json`;
        InputValidator.validateUrl(this.node.path, 'provisioning template url', httpUrl);
        productVersions.push(
          {
            name: productVersionName,
            description: productDetail.productDescription,
            disableTemplateValidation: productDetail.validateTemplate === false ? true : false,
            info: {
              LoadTemplateFromURL: httpUrl,
            },
          },
        );
        deployedProductVersions.add(productVersionName);
      }
    }
    return productVersions;
  }

  private existInContextFile(productDetail: ProductDetail) : boolean {
    const contextFileName = 'cdk.context.json';
    if (fs.existsSync(contextFileName)) {
      const contextJson = fs.readFileSync(contextFileName);
      const contextJsonMap = JSON.parse(contextJson.toString());
      if (contextJsonMap.autoVersioningMap[productDetail.productName][productDetail.productStackId][productDetail.productVersionName] == undefined ) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  private validateProductProps(props: CloudFormationProductProps) {
    InputValidator.validateLength(this.node.path, 'product product name', 1, 100, props.productName);
    InputValidator.validateLength(this.node.path, 'product owner', 1, 8191, props.owner);
    InputValidator.validateLength(this.node.path, 'product description', 0, 8191, props.description);
    InputValidator.validateLength(this.node.path, 'product distributor', 0, 8191, props.distributor);
    InputValidator.validateEmail(this.node.path, 'support email', props.supportEmail);
    InputValidator.validateUrl(this.node.path, 'support url', props.supportUrl);
    InputValidator.validateLength(this.node.path, 'support description', 0, 8191, props.supportDescription);
    if (props.productVersions.length == 0) {
      throw new Error(`Invalid product versions for resource ${this.node.path}, must contain at least 1 product version`);
    }
    props.productVersions.forEach(productVersion => {
      InputValidator.validateLength(this.node.path, 'provisioning artifact name', 0, 100, productVersion.productVersionName);
      InputValidator.validateLength(this.node.path, 'provisioning artifact description', 0, 8191, productVersion.description);
    });
  }
}
