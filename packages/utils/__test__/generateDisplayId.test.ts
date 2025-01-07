import { generateDisplayId } from '../src/generateDisplayId';
import { describe, expect, it } from 'vitest';

describe('generateDisplayId', () => {
  it('should generate a display ID with the correct length', () => {
    const id = generateDisplayId();
    expect(id).toHaveLength(7);
  });

  it('should generate a display ID with valid characters', () => {
    const id = generateDisplayId();
    expect(id).toMatch(/^[A-HJ-NP-Z2-9]{7}$/);
  });
});
