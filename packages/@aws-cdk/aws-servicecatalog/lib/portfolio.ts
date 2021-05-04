/* eslint-disable */

import * as iam from '@aws-cdk/aws-iam';
import { IResource, Resource } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { CfnPortfolio, CfnPortfolioPrincipalAssociation } from './servicecatalog.generated';

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
   * Grant read permissions for this stream and its contents to an IAM
   * principal (Role/Group/User).
   *
   * If an encryption key is used, permission to ues the key to decrypt the
   * contents of the stream will also be granted.
   */
  associatePrincipal(principal: iam.IRole): void;


}


/**
 * A reference to a stream. The easiest way to instantiate is to call
 * `stream.export()`. Then, the consumer can use `Stream.import(this, ref)` and
 * get a `Stream`.
 */
export interface PortfolioAttributes {
  /**
  * The ARN of the stream.
  */
  readonly portfolioName: string;
}

/**
* Represents a Kinesis Stream.
*/
abstract class PortfolioBase extends Resource implements IPortfolio {

  /**
  * The name of the stream
  */
  public abstract readonly id: string;

  /**
  * The name of the stream
  */
  public abstract readonly portfolioName: string;


  /**
  * Grant write permissions for this stream and its contents to an IAM
  * principal (Role/Group/User).
  *
  * If an encryption key is used, permission to ues the key to decrypt the
  * contents of the stream will also be granted.
  */
  public abstract associatePrincipal(principal: iam.IRole): void;    
 
}

  /**
 * Properties for a Kinesis Stream
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
 * A Kinesis stream. Can be encrypted with a KMS key.
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

