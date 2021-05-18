import * as iam from '@aws-cdk/aws-iam';
// import * as sc from '@aws-cdk/aws-servicecatalog';
import { App, Stack } from '@aws-cdk/core';
import { Portfolio, Product } from '../lib';
import { CfnCloudFormationProduct } from '../lib/servicecatalog.generated';

const app = new App();
const stack = new Stack(app, 'integ-servicecatalog-portfolio');

const role = new iam.Role(stack, 'TestRole', {
  assumedBy: new iam.AccountRootPrincipal(),
});

const portfolio = new Portfolio(stack, 'TestPortfolio', {
  displayName: 'TestPortfolio',
  providerName: 'TestProvider',
});


const product = new Product(stack, 'TestProduct', {
  name: 'TestProduct',
  owner: 'Test Owner',
  provisioningArtifacts: [{ templateUrl: 'www.s3.yaml' }],
});


const l1product = new CfnCloudFormationProduct(stack, 'TestL1Product', {
  name: 'Testl1Product',
  owner: 'Test Owner',
  provisioningArtifactParameters: [
    {
      info: {
        LoadTemplateFromURL: 'www.s3.yaml',
      },
    },
  ],
});


portfolio.associatePrincipal(role);

portfolio.associateProduct(product);

portfolio.associateProduct(l1product);
app.synth();