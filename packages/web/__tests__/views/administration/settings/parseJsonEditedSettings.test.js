import { describe, expect, it } from 'vitest';
import * as yup from 'yup';
import { parseJsonEditedSettings } from '../../../../app/views/administration/settings/parseJsonEditedSettings';

const schema = {
  properties: {
    templates: {
      properties: {
        letterhead: { type: yup.string() },
        vaccineCertificate: { type: yup.object() },
        allowedCodes: { type: yup.array() },
        maxPageSize: { type: yup.number() },
      },
    },
  },
};

const parse = settings => parseJsonEditedSettings(settings, schema);

describe('parseJsonEditedSettings', () => {
  it('parses the JSON text held by object and array settings', () => {
    expect(
      parse({ templates: { vaccineCertificate: '{"a":1}', allowedCodes: '[1,2]' } }),
    ).toEqual({ templates: { vaccineCertificate: { a: 1 }, allowedCodes: [1, 2] } });
  });

  it('leaves a string setting alone when its content looks like JSON', () => {
    expect(parse({ templates: { letterhead: '{"a":1}' } })).toEqual({
      templates: { letterhead: '{"a":1}' },
    });
  });

  it('leaves the string "null" as a string', () => {
    expect(parse({ templates: { letterhead: 'null' } })).toEqual({
      templates: { letterhead: 'null' },
    });
  });

  it('keeps malformed JSON as text so validation can flag it', () => {
    expect(parse({ templates: { vaccineCertificate: '{"a":' } })).toEqual({
      templates: { vaccineCertificate: '{"a":' },
    });
  });

  it('passes through values that are already parsed', () => {
    expect(
      parse({ templates: { vaccineCertificate: { a: 1 }, maxPageSize: 20 } }),
    ).toEqual({ templates: { vaccineCertificate: { a: 1 }, maxPageSize: 20 } });
  });

  it('leaves settings with no matching schema node untouched', () => {
    expect(parse({ removed: { setting: '{"a":1}' } })).toEqual({
      removed: { setting: '{"a":1}' },
    });
  });
});
