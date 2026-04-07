import { safeJsonParse } from '../src/safeJsonParse';
import { describe, expect, it } from 'vitest';

describe('safeJsonParse', () => {
  it('should return null for empty string', () => {
    expect(safeJsonParse('')).toBeNull();
  });

  it('should return null for invalid JSON string', () => {
    expect(safeJsonParse('invalid')).toBeNull();
  });

  it('should parse valid JSON string', () => {
    const jsonString = '{"key": "value"}';
    expect(safeJsonParse(jsonString)).toEqual({ key: 'value' });
  });
});
