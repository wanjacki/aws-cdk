import '@aws-cdk/assert-internal/jest';
import { Role, AccountRootPrincipal } from '@aws-cdk/aws-iam';
import { Stack, Tag } from '@aws-cdk/core';
import { AcceptLanguage, Portfolio, Product } from '../lib';


describe('Portfolio', () => {

  test('default portfolio', () => {
    const stack = new Stack();

    new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
    });

    expect(stack).toMatchTemplate({
      Resources: {
        myPortfolio7B254FA7: {
          Type: 'AWS::ServiceCatalog::Portfolio',
          Properties: {
            DisplayName: 'testPortfolio',
            ProviderName: 'testProvider',
          },
        },
      },
    });
  });

  test('portfolio with more parameters', () => {
    const stack = new Stack();

    new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
      description: 'test portfolio description',
    });

    expect(stack).toMatchTemplate({
      Resources: {
        myPortfolio7B254FA7: {
          Type: 'AWS::ServiceCatalog::Portfolio',
          Properties: {
            DisplayName: 'testPortfolio',
            ProviderName: 'testProvider',
            Description: 'test portfolio description',
          },
        },
      },
    });
  });


  test('portfolio with tags', () => {
    const stack = new Stack();

    const tag1 = new Tag('myTestKey1', 'myTestKeyValue1');
    const tag2 = new Tag('myTestKey2', 'myTestKeyValue2');

    new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
      description: 'test portfolio description',
      tags: [tag1, tag2],
    });

    expect(stack).toMatchTemplate({
      Resources: {
        myPortfolio7B254FA7: {
          Type: 'AWS::ServiceCatalog::Portfolio',
          Properties: {
            DisplayName: 'testPortfolio',
            ProviderName: 'testProvider',
            Description: 'test portfolio description',
            Tags: [
              {
                Key: 'myTestKey1',
                Value: 'myTestKeyValue1',
              },
              {
                Key: 'myTestKey2',
                Value: 'myTestKeyValue2',
              },
            ],

          },
        },
      },
    });
  });


  test('portfolio from attributes', () => {
    const stack = new Stack();

    const p = Portfolio.fromPortfolioAttributes(stack, 'MyPortfolio', {
      portfolioArn: 'arn:aws:servicecatalog:region:account-id:portfolio/portfolio-name',
    });

    expect(p.portfolioArn).toEqual('arn:aws:servicecatalog:region:account-id:portfolio/portfolio-name');
  });


  test('portfolio with different accept language', () => {
    const stack = new Stack();

    new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
      acceptLanguage: AcceptLanguage.JP,
    });

    expect(stack).toMatchTemplate({
      Resources: {
        myPortfolio7B254FA7: {
          Type: 'AWS::ServiceCatalog::Portfolio',
          Properties: {
            DisplayName: 'testPortfolio',
            ProviderName: 'testProvider',
            AcceptLanguage: 'jp',
          },
        },
      },
    });
  });


  test('portfolio share', () => {
    const stack = new Stack();
    const shareAccountId = '012345678901';

    const p = new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
    });

    p.share(shareAccountId);

    expect(stack).toHaveResource('AWS::ServiceCatalog::PortfolioShare', {
      AccountId: shareAccountId,
    });
  });


  test('portfolio principal association', () => {
    const stack = new Stack();

    const p = new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
    });

    const role = new Role(stack, 'TestRole', {
      assumedBy: new AccountRootPrincipal(),
    });

    p.associatePrincipal(role);

    expect(stack).toHaveResource('AWS::ServiceCatalog::PortfolioPrincipalAssociation', {
    });
  });


  test('portfolio product association', () => {
    const stack = new Stack();

    const p = new Portfolio(stack, 'myPortfolio', {
      portfolioName: 'testPortfolio',
      providerName: 'testProvider',
    });

    const product = new Product(stack, 'myProduct', {
      name: 'TestL2Product',
      owner: 'Test Owner',
      provisioningArtifacts: [{ templateUrl: 'www.google.com' }],
    });

    p.associateProduct(product);

    expect(stack).toHaveResource('AWS::ServiceCatalog::PortfolioProductAssociation', {
    });
  });


},
);
