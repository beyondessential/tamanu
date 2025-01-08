import { camelCaseProperties } from '../src/camelCaseProperties';
import { describe, expect, it } from 'vitest';

describe('camelCaseProperties', () => {
  it('should convert object keys to camelCase', () => {
    const obj = { some_key: 'value', another_key: 'anotherValue' };
    const result = camelCaseProperties(obj);
    expect(result).toEqual({ someKey: 'value', anotherKey: 'anotherValue' });
  });

  it('should handle empty object', () => {
    const obj = {};
    const result = camelCaseProperties(obj);
    expect(result).toEqual({});
  });

  it('should handle object with no keys to convert', () => {
    const obj = { someKey: 'value' };
    const result = camelCaseProperties(obj);
    expect(result).toEqual({ someKey: 'value' });
  });
});
