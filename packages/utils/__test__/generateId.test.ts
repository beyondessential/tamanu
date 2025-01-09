import { generateId, isGeneratedDisplayId, fakeUUID, FAKE_UUID_PATTERN } from '../src/generateId';
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
