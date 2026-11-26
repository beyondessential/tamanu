import { describe, expect, it } from 'vitest';
import { parseScannedDisplayId } from '../src/scannedDisplayId';

describe('parseScannedDisplayId', () => {
  it('trims surrounding whitespace', () => {
    expect(parseScannedDisplayId('  TMN284711\n', '^TMN\\d{6}$')).toBe('TMN284711');
  });

  it('accepts codes matching the display ID pattern', () => {
    expect(parseScannedDisplayId('TMN284711', '^TMN\\d{6}$')).toBe('TMN284711');
  });

  it('rejects codes not matching the display ID pattern', () => {
    expect(parseScannedDisplayId('https://example.com', '^TMN\\d{6}$')).toBeNull();
  });

  it('accepts any code when no pattern is set', () => {
    expect(parseScannedDisplayId('anything at all', undefined)).toBe('anything at all');
    expect(parseScannedDisplayId('anything at all', '')).toBe('anything at all');
  });

  it('rejects every code when the pattern is not a valid regex', () => {
    expect(parseScannedDisplayId('TMN284711', '[')).toBeNull();
  });

  it('rejects codes over 50 characters', () => {
    expect(parseScannedDisplayId('A'.repeat(50), undefined)).toBe('A'.repeat(50));
    expect(parseScannedDisplayId('A'.repeat(51), undefined)).toBeNull();
  });

  it('rejects blank codes', () => {
    expect(parseScannedDisplayId('   ', undefined)).toBeNull();
  });
});
