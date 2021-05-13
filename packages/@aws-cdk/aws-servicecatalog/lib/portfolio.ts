/* eslint-disable */
import * as iam from '@aws-cdk/aws-iam';
import { IResource, Resource } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnPortfolio, CfnPortfolioPrincipalAssociation } from './servicecatalog.generated';

/**
 * A Service Catalog portfolio
 */
export interface IPortfolio extends IResource {

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
   * principal (Role/Group/User).
   */
  associatePrincipal(principal: iam.IRole): void;
}


/**
 * A reference to a portfolio
 */
export interface PortfolioAttributes {
  /**
  * The name of the portfolo.
  */
  readonly portfolioName: string;
}

/**
* Represents a Service Catalog portfolio.
*/
abstract class PortfolioBase extends Resource implements IPortfolio {

  /**
  * The id of the portfolio
  */
  public abstract readonly id: string;

  /**
  * The name of the portfolio
  */
  public abstract readonly portfolioName: string;


  /**
  * Associate a principal with the portfolio
  *
  */
  public abstract associatePrincipal(principal: iam.IRole): void;    


 
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
     * The number of hours for the data records that are stored in shards to remain accessible.
     * @default no
     */
    readonly providerName: string;
  
    /**
     * The number of shards for the stream.
     * @default no
     */
    readonly acceptLanguage?: string;
  
    /**
     * The kind of server-side encryption to apply to this stream.
     *
     * If you choose KMS, you can specify a KMS key via `encryptionKey`. If
     * encryption key is not specified, a key will automatically be created.
     *
     * @default - no
     */
    readonly description?: string;
  
  }

  /**
 * A Service Catalog portfolio
 */
export class Portfolio extends PortfolioBase {
  
    public readonly portfolioName: string;
    public readonly id: string;
  
    private readonly portfolio: CfnPortfolio;

  
    constructor(scope: Construct, id: string, props: PortfolioProps) {
      super(scope, id, {
        physicalName: props.displayName,
      });

  
      this.portfolio = new CfnPortfolio(this, 'Resource', {
         displayName: props.displayName,
         providerName: props.providerName
      });
  
      this.portfolioName = this.getResourceNameAttribute(props.displayName);
      this.id = this.getResourceNameAttribute(this.portfolio.ref);

    }
  
   public associatePrincipal(principal: iam.IRole) {
    new CfnPortfolioPrincipalAssociation(this, 'PortfolioPrincipalAssociation', {
        portfolioId: this.portfolio.ref,
        principalArn: principal.roleArn,
        principalType: 'IAM'
    })
   }

  }

