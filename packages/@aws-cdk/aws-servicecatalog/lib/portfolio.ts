import * as iam from '@aws-cdk/aws-iam';
import { IResource, Resource, Tag, Stack } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { Product } from './product';
import { CfnPortfolio, CfnPortfolioPrincipalAssociation, CfnCloudFormationProduct, CfnPortfolioProductAssociation } from './servicecatalog.generated';

/**
 * A Service Catalog portfolio
 */
export interface IPortfolio extends IResource {

  /**
   * The ARN of the portfolio.
   *
   * @attribute
   */
  readonly portfolioArn: string;

  /**
   * The ID of the portfolio.
   *
   * @attribute
   */
  readonly id: string;

  /**
   * The name of the portfolio
   *
   * @attribute
   */
  readonly portfolioName: string;

  /**
   * Associate portfolio with a principal
   * (Role/Group/User).
   */
  associatePrincipal(principal: iam.IRole, principalType?: PrincipalType): void;


  /**
   * Associate portfolio with the given product
   */
  associateProduct(product: CfnCloudFormationProduct | Product): void;
}


/**
 * A reference to a portfolio
 */
export interface PortfolioAttributes {


  /**
  * The ARN of the portfolo.
  */
  readonly portfolioArn: string;
}

/**
* Represents a Service Catalog portfolio.
*/
abstract class PortfolioBase extends Resource implements IPortfolio {


  /**
  * The arn of the portfolio
  */
  public abstract readonly portfolioArn: string;

  /**
  * The id of the portfolio
  */
  public abstract readonly id: string;

  /**
  * The name of the portfolio
  */
  public abstract readonly portfolioName: string;

  public associatePrincipal(principal: iam.IRole, principalType:PrincipalType=PrincipalType.IAM) {
    new CfnPortfolioPrincipalAssociation(this, 'PortfolioPrincipalAssociation', {
      portfolioId: this.id,
      principalArn: principal.roleArn,
      principalType: principalType,
    });
  }

  public associateProduct(product: CfnCloudFormationProduct | Product) {
    new CfnPortfolioProductAssociation(this, 'PortfolioProductAssociation', {
      portfolioId: this.id,
      productId: (product instanceof CfnCloudFormationProduct? product.ref: product.id),
    });
  }

}

/**
 * Properties for a Portfolio
 */
export interface PortfolioProps {
  /**
     * Enforces a particular physical stream name.
     * @default <generated>
     */
  readonly displayName: string;

  /**
     * The providerName
     *
     */
  readonly providerName: string;

  /**
     * The accept language
     * @default - AcceptLanguage.EN 
     */
  readonly acceptLanguage?: AcceptLanguage;

  /**
     * Description for portfolio
     *
     * @default
     */
  readonly description?: string;


  /**
     * A collection of tags attached to portfolio
     *
     * @default
     *
     */
  readonly tags?: Tag[];

}

/**
 * A Service Catalog portfolio
 */
export class Portfolio extends PortfolioBase {


  /**
   * Import an existing Service Catalog Portfolio provided an ARN
   *
   * @param scope The parent creating construct (usually `this`).
   * @param id The construct's name
   * @param portfolioArn portofolio ARN (i.e. arn:aws:aws-servicecatalog:<region>:<account-id>:portfolio/Foo)
   */
  public static fromPortfolioArn(scope: Construct, id: string, portfolioArn: string): IPortfolio {
    return Portfolio.fromPortfolioAttributes(scope, id, { portfolioArn });
  }

  /**
     * Creates a Stream construct that represents an external stream.
     *
     * @param scope The parent creating construct (usually `this`).
     * @param id The construct's name.
     * @param attrs Portfolio import properties
     */
  public static fromPortfolioAttributes(scope: Construct, id: string, attrs: PortfolioAttributes): IPortfolio {
    class Import extends PortfolioBase {
      public readonly id = id
      public readonly portfolioArn = attrs.portfolioArn;
      public readonly portfolioName = Stack.of(scope).parseArn(attrs.portfolioArn).resourceName!;
    }

    return new Import(scope, id);
  }

  public readonly portfolioArn: string;
  public readonly portfolioName: string;
  public readonly id: string;

  private readonly portfolio: CfnPortfolio;


  constructor(scope: Construct, id: string, props: PortfolioProps) {
    super(scope, id, {
      physicalName: props.displayName,
    });

    const acceptLanguage = this.parseAcceptLanguage(props);

    

    this.portfolio = new CfnPortfolio(this, 'Resource', {
      displayName: props.displayName,
      providerName: props.providerName,
      description: props.description,
      tags: props.tags,
      acceptLanguage: props.acceptLanguage
    });

    this.portfolioArn = this.getResourceArnAttribute(this.portfolio.ref, {
      service: 'servicecatalog',
      resource: 'portfolio',
      resourceName: this.physicalName,
    });

    

    this.portfolioName = this.getResourceNameAttribute(props.displayName);
    this.id = this.getResourceNameAttribute(this.portfolio.ref);


  }


  private parseAcceptLanguage(props: PortfolioProps): AcceptLanguage
    {

      if (!props.acceptLanguage){
        return AcceptLanguage.EN
      }
      if (props.acceptLanguage == AcceptLanguage.EN) {
        return AcceptLanguage.EN;
      } else if (props.acceptLanguage == AcceptLanguage.JP) {
        return AcceptLanguage.JP;
      } else if (props.acceptLanguage == AcceptLanguage.ZH) {
        return AcceptLanguage.ZH;
      } else {
        throw new Error(`Unexpected 'acceptLanguage': ${props.acceptLanguage}`);
      }
    }


}

/**
 * The language code
 */
export enum AcceptLanguage {
  /**
   * English
   */
  EN = 'en',

  /**
   * Japanese
   */
  JP = 'jp',

  /**
   * Chinese
   */
  ZH = 'zh'
}

/**
 * The principal type
 * Only supported version currently is IAM
 */
export enum PrincipalType {
/**
 * IAM
 */
  IAM ='IAM'
}