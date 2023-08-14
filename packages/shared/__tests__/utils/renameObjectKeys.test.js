import { camelify, renameObjectKeys } from '../../src/utils/renameObjectKeys';

describe('renameObjectKeys', () => {
  it('should change snake to camel case', () => {
    expect(camelify('one_underscore')).toEqual('oneUnderscore');
    expect(camelify('two_underscores_string')).toEqual('twoUnderscoresString');
    expect(camelify('Starts_with_capital')).toEqual('StartsWithCapital');
    expect(camelify('double__underscore')).toEqual('doubleUnderscore');
    expect(camelify('_starts_with_underscore')).toEqual('StartsWithUnderscore');
  });

  it('should rename the keys of an object', () => {
    // mimic output of patient search query
    const base = {
      encounter_id: '12345',
      encounter_type: 'clinic',
      department_id: '10101',
      department_name: 'department',
      firstName: 'test',
    };

    const result = renameObjectKeys(base);

    expect(result).toHaveProperty('encounterId', base.encounter_id);
    expect(result).toHaveProperty('encounterType', base.encounter_type);
    expect(result).toHaveProperty('departmentId', base.department_id);
    expect(result).toHaveProperty('departmentName', base.department_name);
    expect(result).toHaveProperty('firstName', base.firstName);
  });

  it('should not modify a nested object', () => {
    const base = {
      notModified: { not_modified: 'intact' },
    };

    const result = renameObjectKeys(base);

    expect(result).toHaveProperty('notModified.not_modified', base.notModified.not_modified);
  });

  it('should not modify the input object', () => {
    const base = {
      original_key: 'original_value',
    };

    const result = renameObjectKeys(base);
    expect(result).toHaveProperty('originalKey', 'original_value');
    expect(base).toHaveProperty('original_key', 'original_value');
  });

  it('should not preserve original keys', () => {
    const base = {
      original_key: 'original_value',
    };

    const result = renameObjectKeys(base);
    expect(result).not.toHaveProperty('original_key');
  });
});
