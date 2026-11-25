import { describe, expect, it } from 'vitest';
import { escapeLikeWildcards } from '../src/escapeLikeWildcards';

describe('escapeLikeWildcards', () => {
  it('escapes a percent sign', () => {
    expect(escapeLikeWildcards('100%')).toBe('100\\%');
  });

  it('escapes an underscore', () => {
    expect(escapeLikeWildcards('Bob_by')).toBe('Bob\\_by');
  });

  it('escapes a backslash', () => {
    expect(escapeLikeWildcards('a\\b')).toBe('a\\\\b');
  });

  it('escapes every wildcard in a value', () => {
    expect(escapeLikeWildcards('%_\\_%')).toBe('\\%\\_\\\\\\_\\%');
  });

  it('leaves a value without wildcards unchanged', () => {
    expect(escapeLikeWildcards("O'Brien-Smith")).toBe("O'Brien-Smith");
  });

  it('leaves an empty value unchanged', () => {
    expect(escapeLikeWildcards('')).toBe('');
  });
});
