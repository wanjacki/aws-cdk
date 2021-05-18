/* eslint-disable */
import { IResource, Resource, Tag } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnCloudFormationProduct } from './servicecatalog.generated';


/** docstring*/
export interface IProduct extends IResource {

  /**
   * The id of the product
   *
   * @attribute
   */
  readonly id: string;


  /**
   * The name of the product
   *
   * @attribute
   */
  readonly name: string;

}


/**
* Represents a Service Catalog CloudFormation Product.
*/
abstract class ProductBase extends Resource implements IProduct {

  /**
  * The logical id of the product
  */
  public abstract readonly id: string;

  /**
  * The name of the product
  */
  public abstract readonly name: string;


 
}



/**
 * 
 * 
 * docstring
 */
export interface ProvisioningArtifactProperties {


        /**
     * The name of the product.
     * @default
     */
    readonly description?: string;

    /**
     * The name of the product.
     * @default True
     */
    readonly disableTemplateValidation?: boolean;

    /**
     * The name of the product.
     */
    readonly templateUrl: string;

    /**
     * The name of the product.
     * @default
     */
    readonly name?: string;


}




  /**
 * Properties for a Cloudformation Product
 */
export interface ProductProps {

    /**
     * The name of the product.
     */
    readonly name: string;

     /**
     * The language code.
     * @default 'en'
     */
    readonly acceptLanguage?: string;
  
    /**
     * The description of the product.
     * @default
     */
    readonly description?: string;
  
    /**
     * The distributor of the product.
     * @default
     */
    readonly distributor?: string;

  
    /**
     * The owner of the product.
     *
     */
    readonly owner: string;


    /**
     * The configuration of the provisioning artifact (also known as a version).
     * 
     */
    readonly provisioningArtifacts: ProvisioningArtifactProperties[];

    /**
     * ReplaceProvisioningArtifacts
     * @default false
     *
     */
     readonly replaceProvisioningParameters?: boolean;

    /**
     * The support information about the product
     * @default 
     */
     readonly supportDescription?: string;

    /**
     * The contact email for product support.
     * @default
     */
     readonly supportEmail?: string;

    /**
     * The contact URL for product support.
     * @default
     */
     readonly supportUrl?: string;

    /**
     * One or more tags.
     * @default 
     */
     readonly tags?: Tag[];
  
  }

  /**
 * A Service Catalog Cloudformation Product. 
 * @resource AWS::ServiceCatalog::CloudFormationProduct
 */
export class Product extends ProductBase {
  
    public readonly name: string;
    public readonly id: string;  
    private readonly product: CfnCloudFormationProduct;


    

  
    constructor(scope: Construct, id: string, props: ProductProps) {
        super(scope,id, {}
        );




  
      this.product = new CfnCloudFormationProduct(this, 'Resource', {
        acceptLanguage: props.acceptLanguage,
        description: props.description,
        distributor: props.distributor,
        name: props.name,
        owner: props.owner,
        provisioningArtifactParameters: this.generateProvisioningArtifactParameters(props),
        replaceProvisioningArtifacts: props.replaceProvisioningParameters,
        supportDescription: props.supportDescription,
        supportEmail: props.supportEmail,
        supportUrl: props.supportUrl,
        tags: props.tags
    
      });
  
      this.name = this.getResourceNameAttribute(props.name);
      this.id = this.getResourceNameAttribute(this.product.ref);



    }

    


    private generateProvisioningArtifactParameters(props: ProductProps): any[] {
    return props.provisioningArtifacts.map(pa => {
      return {
        name : pa.name,
        description : pa.description,
        disableTemplateValidation: pa.disableTemplateValidation,
        info : {
          LoadTemplateFromURL: pa.templateUrl
        }

      
    }});
  

 

  };

}