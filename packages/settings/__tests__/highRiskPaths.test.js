import * as yup from 'yup';
import { extractHighRiskPaths } from '../src/schema/utils';

describe('extractHighRiskPaths', () => {
  const schema = {
    properties: {
      plain: { type: yup.string(), defaultValue: '' },
      risky: { type: yup.string(), defaultValue: '', highRisk: true },
      mail: {
        // group-level flag cascades to every leaf beneath it
        highRisk: true,
        properties: {
          from: { type: yup.string(), defaultValue: '' },
          transport: {
            properties: {
              host: { type: yup.string(), defaultValue: '' },
            },
          },
        },
      },
      nested: {
        properties: {
          safe: { type: yup.string(), defaultValue: '' },
          alsoRisky: { type: yup.string(), defaultValue: '', highRisk: true },
          apiKey: { type: yup.string(), secret: true },
        },
      },
    },
  };

  it('collects flagged leaves, cascades group flags, and treats secrets as high-risk', () => {
    expect(extractHighRiskPaths(schema).sort()).toEqual([
      'mail.from',
      'mail.transport.host',
      'nested.alsoRisky',
      'nested.apiKey',
      'risky',
    ]);
  });

  it('returns nothing for a schema without flags', () => {
    expect(
      extractHighRiskPaths({ properties: { a: { type: yup.string(), defaultValue: '' } } }),
    ).toEqual([]);
  });
});
