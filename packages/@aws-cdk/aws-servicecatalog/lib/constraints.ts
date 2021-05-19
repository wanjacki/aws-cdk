/* eslint-disable */

import * as iam from '@aws-cdk/aws-iam';
import { IProduct } from './product';
import { AcceptLanguage } from './portfolio';
import { IRole } from '@aws-cdk/aws-iam';
import { CfnRule } from '@aws-cdk/core';

/**
 * Properties for LaunchRoleConstraint.
 */
export interface ConstraintOptions {
  /**
  * The language code.
  * @default 'en'
  */
  readonly acceptLanguage?: AcceptLanguage;

  /**
  * The description of the constraint.
  * @default ''
  */
  readonly description?: string;

  /**
  * A reference to product
  */
  readonly product: IProduct;
}


/**
 * Properties for LaunchNotificationConstraint.
 */
export interface LaunchNotificationConstraintProps extends ConstraintOptions {
  /**
  * A list of notification ARNs.
  */
  readonly notificationArns: string[];
}

/**
 * Properties for LaunchRoleConstraint.
 */
export interface LaunchRoleConstraintProps extends ConstraintOptions {
  /**
  * A reference to a Role
  */
  readonly role: iam.IRole;
}


/**
 * Properties for LaunchTemplateConstraint.
 */
export interface LaunchTemplateConstraintProps extends ConstraintOptions {
  /**
  * The rules for the template constraint
  * @default '{}'
  */
  readonly rules?: CfnRule;
}

/**
 * Properties for ResourceUpdateConstraint.
 */
export interface ResourceUpdateConstraintProps extends ConstraintOptions {
  /**
  * Toggle for if users should be allowed to change tags
  * @default true
  */
  readonly tagUpdateOnProvisionedProductAllowed?: boolean;
}

/**
 * Properties for StackSetConstraint.
 */
export interface StackSetConstraintProps extends ConstraintOptions {
  /**
  * One or more AWS accounts that will have access to the provisioned product
  */
  readonly accountList: string[];
  /**
  * One or more AWS Regions where the provisioned product will be available.
  */
  readonly regionList: string[];
  /**
  * ADmin Role
  */
  readonly adminRole: IRole;
  /**
  * Execution Role
  */
  readonly executionRole: IRole;
  /**
  * Toggle for Permission to create, update, and delete stack instances.
  * @default true
  */
  readonly stackInstanceControlAllowed?: boolean;
}

