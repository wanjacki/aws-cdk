import * as iam from '@aws-cdk/aws-iam';
// import * as sc from '@aws-cdk/aws-servicecatalog';
import { App, Stack } from '@aws-cdk/core';
import { Portfolio, Product } from '../lib';

const app = new App();
const stack = new Stack(app, 'integ-servicecatalog-portfolio');

const role = new iam.Role(stack, 'TestRole', {
  assumedBy: new iam.AccountRootPrincipal(),
});

const portfolio = new Portfolio(stack, 'TestPortfolio', {
  portfolioName: 'TestPortfolio',
  providerName: 'TestProvider',
});

const product = new Product(stack, 'TestProduct', {
  name: 'TestProduct',
  owner: 'Test Owner',
  provisioningArtifacts: [{ templateUrl: 'https://cdkexamples.s3.amazonaws.com/cdksample.yaml' }],
});


portfolio.associatePrincipal(role);
portfolio.associateProduct(product);

app.synth();