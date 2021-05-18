import '@aws-cdk/assert-internal/jest';
import { Stack, Tag } from '@aws-cdk/core';
import { Portfolio } from '../lib';

/* eslint-disable quote-props */

describe('Portfolio', () => {


  test('sanity check', () => {
    expect(1).toEqual(1);

  });

  test('default portfolio', () => {
    const stack = new Stack();

    new Portfolio(stack, 'myPortfolio', {
      displayName: 'testPortfolio',
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
      displayName: 'testPortfolio',
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
      displayName: 'testPortfolio',
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
                'Key': 'myTestKey1',
                'Value': 'myTestKeyValue1',
              },
              {
                'Key': 'myTestKey2',
                'Value': 'myTestKeyValue2',
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


},
);
