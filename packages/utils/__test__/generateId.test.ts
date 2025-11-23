import {
  generateId,
  isGeneratedDisplayId,
  fakeUUID,
  FAKE_UUID_PATTERN,
  generateIdFromPattern,
  isGeneratedDisplayIdFromPattern,
} from '../src/generateId';
import { describe, expect, it } from 'vitest';

describe('generateId', () => {
  it('should generate an ID with the correct format', () => {
    const id = generateId();
    expect(id).toMatch(/^[A-Z]{4}\d{6}$/);
  });
});

describe('isGeneratedDisplayId', () => {
  it('should return true for valid generated ID', () => {
    const id = generateId();
    expect(isGeneratedDisplayId(id)).toBe(true);
  });

  it('should return false for invalid ID', () => {
    expect(isGeneratedDisplayId('invalid')).toBe(false);
  });
});

describe('fakeUUID', () => {
  it('should generate a fake UUID with the correct pattern', () => {
    const uuid = fakeUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-0000-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should match the FAKE_UUID_PATTERN', () => {
    const uuid = fakeUUID();
    const regex = new RegExp(FAKE_UUID_PATTERN.replace(/_/g, '[0-9a-f]'));
    expect(uuid).toMatch(regex);
  });
});

describe('generateIdFromPattern', () => {
  it('should generate an ID matching A and 0 placeholders', () => {
    const id = generateIdFromPattern('AA000');
    expect(id).toMatch(/^[A-Z]{2}\d{3}$/);
  });

  it('should use static characters wrapped in brackets', () => {
    const id = generateIdFromPattern('[B]000000');
    expect(id).toMatch(/^B\d{6}$/);
  });

  it('should support multi-character static segments in brackets', () => {
    const id = generateIdFromPattern('[ABC]00');
    expect(id).toMatch(/^ABC\d{2}$/);
  });

  it('should preserve non-placeholder characters outside brackets', () => {
    const id = generateIdFromPattern('XXA0YY');
    expect(id).toMatch(/^XX[A-Z]\dYY$/);
  });

  it('should combine static, letter, and digit segments', () => {
    const id = generateIdFromPattern('[B]AA[A]000');
    expect(id).toMatch(/^B[A-Z]{2}A\d{3}$/);
  });

  it('should handle complex nested bracket and token patterns', () => {
    const pattern = '[[[]00AA[B]';
    const id = generateIdFromPattern(pattern);
    // Example: '[[25LDB'
    expect(id).toMatch(/^\[{2}\d{2}[A-Z]{2}B$/);
  });
});

describe('isGeneratedDisplayIdFromPattern', () => {
  it('should validate IDs generated from a simple pattern', () => {
    const pattern = 'AA000';
    const id = generateIdFromPattern(pattern);
    expect(isGeneratedDisplayIdFromPattern(id, pattern)).toBe(true);
  });

  it('should validate IDs with static bracketed characters', () => {
    const pattern = '[B]000000';
    const id = generateIdFromPattern(pattern);
    expect(isGeneratedDisplayIdFromPattern(id, pattern)).toBe(true);
  });

  it('should validate IDs with mixed static, letters, and digits', () => {
    const pattern = '[B]AA[A]000';
    const id = generateIdFromPattern(pattern);
    expect(isGeneratedDisplayIdFromPattern(id, pattern)).toBe(true);
  });

  it('should return false for IDs that do not match the pattern', () => {
    const pattern = '[B]AA[A]000';
    expect(isGeneratedDisplayIdFromPattern('C123456', pattern)).toBe(false);
    expect(isGeneratedDisplayIdFromPattern('BAAA12X', pattern)).toBe(false);
  });

  it('should validate IDs generated from complex nested bracket patterns', () => {
    const pattern = '[[[]00AA[B]';
    const id = generateIdFromPattern(pattern);
    expect(isGeneratedDisplayIdFromPattern(id, pattern)).toBe(true);
  });

  it('should return false when complex nested bracket patterns do not match', () => {
    const pattern = '[[[]00AA[B]';
    expect(isGeneratedDisplayIdFromPattern('[[12ABX', pattern)).toBe(false);
    expect(isGeneratedDisplayIdFromPattern('[[AB12B', pattern)).toBe(false);
  });
});
