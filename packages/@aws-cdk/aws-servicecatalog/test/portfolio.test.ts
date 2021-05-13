import '@aws-cdk/assert-internal/jest';
import { Stack } from '@aws-cdk/core';
import { Portfolio } from '../lib';

/* eslint-disable quote-props */

describe('Portfolio', () => {


  test('dummy test', () => {
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
});