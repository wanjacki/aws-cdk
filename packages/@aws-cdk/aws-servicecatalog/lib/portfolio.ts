/* eslint-disable */

import * as iam from '@aws-cdk/aws-iam';
import { IResource, Resource, Tag, Stack } from '@aws-cdk/core';
import { Construct } from 'constructs';
import { LaunchNotificationConstraintProps, LaunchRoleConstraintProps, LaunchTemplateConstraintProps, ResourceUpdateConstraintProps, StackSetConstraintProps } from './constraints';
import { IProduct } from './product';
import { CfnLaunchNotificationConstraint, CfnLaunchRoleConstraint, CfnLaunchTemplateConstraint, CfnPortfolio, CfnPortfolioPrincipalAssociation, CfnPortfolioProductAssociation, CfnPortfolioShare, CfnResourceUpdateConstraint, CfnStackSetConstraint } from './servicecatalog.generated';

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
  associateProduct(product: IProduct): void;

  /**
   * Share portfolio with another account
   */
  share(accountId: string, shareTagOptions?: boolean, acceptLanguage?: AcceptLanguage): void;

  /**
   * Add Launch Notification Constraint
   */
  addLaunchNotificationConstraint(launchNotificationConstraintProps: LaunchNotificationConstraintProps): void;

  /**
   * Add Launch Role Constraint
   */
  addLaunchRoleConstraint(launchRoleConstraintProps: LaunchRoleConstraintProps): void;

  /**
  * Add Launch Template Constraint
  */
  addLaunchTemplateConstraint(launchTemplateConstraintProps: LaunchTemplateConstraintProps): void;

  /**
  * Add Resource Update Constraint
  */
  addResourceUpdateConstraint(resourceUpdateConstraintProps: ResourceUpdateConstraintProps): void;

  /**
  * Add Stack Set Constraint
  */
  addStackSetConstraint(stackSetConstraintProps: StackSetConstraintProps): void;
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


  /**
  * Associate principal to portfolio
  */
  public associatePrincipal(principal: iam.IRole, principalType: PrincipalType = PrincipalType.IAM) {
    new CfnPortfolioPrincipalAssociation(this, 'PortfolioPrincipalAssociation', {
      portfolioId: this.id,
      principalArn: principal.roleArn,
      principalType: principalType,
    });
  }

  /**
  * Associate product to portfolio
  */
  public associateProduct(product: IProduct) {
    new CfnPortfolioProductAssociation(this, 'PortfolioProductAssociation', {
      portfolioId: this.id,
      productId: product.id,
    });
  }

  /**
  * Share the portfolio with a designated account
  */
  public share(accountId: string, shareTagOptions?: boolean, acceptLanguage?: AcceptLanguage) {
    new CfnPortfolioShare(this, 'PortfolioShare', {
      portfolioId: this.id,
      accountId: accountId,
      shareTagOptions: shareTagOptions,
      acceptLanguage: acceptLanguage,
    });
  }

  public addLaunchNotificationConstraint(launchNotificationConstraintProps: LaunchNotificationConstraintProps) {
    new CfnLaunchNotificationConstraint(this, 'LaunchNotificationConstraint', {
      acceptLanguage: launchNotificationConstraintProps.acceptLanguage || 'en',
      description: launchNotificationConstraintProps.description,
      portfolioId: this.id,
      productId: launchNotificationConstraintProps.product.id,
      notificationArns: launchNotificationConstraintProps.notificationArns
    });
  }

  public addLaunchRoleConstraint(launchRoleConstraintProps: LaunchRoleConstraintProps) {
    new CfnLaunchRoleConstraint(this, 'LaunchRoleConstraint', {
      acceptLanguage: launchRoleConstraintProps.acceptLanguage || 'en',
      description: launchRoleConstraintProps.description || '',
      portfolioId: this.id,
      productId: launchRoleConstraintProps.product.id,
      roleArn: launchRoleConstraintProps.role.roleArn
    });
  }

  public addLaunchTemplateConstraint(launchTemplateConstraintProps: LaunchTemplateConstraintProps) {
    new CfnLaunchTemplateConstraint(this, 'LaunchTemplateConstraint', {
      acceptLanguage: launchTemplateConstraintProps.acceptLanguage || 'en',
      description: launchTemplateConstraintProps.description || '',
      portfolioId: this.id,
      productId: launchTemplateConstraintProps.product.id,
      rules: JSON.stringify(launchTemplateConstraintProps.rules?._toCloudFormation()) || '{}'
    });
  }

  public addResourceUpdateConstraint(resourceUpdateConstraintProps: ResourceUpdateConstraintProps) {
    new CfnResourceUpdateConstraint(this, 'ResourceUpdateConstraint', {
      acceptLanguage: resourceUpdateConstraintProps.acceptLanguage || 'en',
      description: resourceUpdateConstraintProps.description || '',
      portfolioId: this.id,
      productId: resourceUpdateConstraintProps.product.id,
      tagUpdateOnProvisionedProduct: resourceUpdateConstraintProps.tagUpdateOnProvisionedProductAllowed === false ? "NOT_ALLOWED" : "ALLOWED"
    });
  }

  public addStackSetConstraint(stackSetConstraintProps: StackSetConstraintProps) {
    new CfnStackSetConstraint(this, 'StackSetConstraint', {
      acceptLanguage: stackSetConstraintProps.acceptLanguage || 'en',
      description: stackSetConstraintProps.description || '',
      portfolioId: this.id,
      productId: stackSetConstraintProps.product.id,
      accountList: stackSetConstraintProps.accountList,
      regionList: stackSetConstraintProps.regionList,
      adminRole: stackSetConstraintProps.adminRole.roleArn,
      executionRole: stackSetConstraintProps.adminRole.roleName,
      stackInstanceControl: stackSetConstraintProps.stackInstanceControlAllowed === false ? "NOT_ALLOWED" : "ALLOWED"
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
  readonly portfolioName: string;

  /**
     * The providerName
     *
     */
  readonly providerName: string;

  /**
     * The accept language
     * @default
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
      physicalName: props.portfolioName,
    });

    // Check if language is defined and/or valid
    const acceptLanguage = props.acceptLanguage || undefined;

    this.portfolio = new CfnPortfolio(this, 'Resource', {
      displayName: props.portfolioName,
      providerName: props.providerName,
      description: props.description,
      tags: props.tags,
      acceptLanguage: acceptLanguage,
    });

    this.portfolioArn = this.getResourceArnAttribute(this.portfolio.ref, {
      service: 'servicecatalog',
      resource: 'portfolio',
      resourceName: this.physicalName,
    });

    this.portfolioName = this.getResourceNameAttribute(props.portfolioName);
    this.id = this.getResourceNameAttribute(this.portfolio.ref);

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
  IAM = 'IAM'
}