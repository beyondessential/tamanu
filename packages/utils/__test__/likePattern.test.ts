import { describe, expect, it } from 'vitest';
import { likePattern } from '../src/likePattern';

describe('likePattern', () => {
  it('keeps the template wildcards', () => {
    expect(likePattern`%${'smith'}%`).toBe('%smith%');
    expect(likePattern`${'smith'}%`).toBe('smith%');
    expect(likePattern`${'2026'}%-${'01'}-${'02'}%`).toBe('2026%-01-02%');
  });

  it('escapes wildcards and the escape character in interpolated values', () => {
    expect(likePattern`%${'_'}%`).toBe('%\\_%');
    expect(likePattern`${'50%'}%`).toBe('50\\%%');
    expect(likePattern`%${'a\\b'}%`).toBe('%a\\\\b%');
  });

  it('matches a value with no template wildcards exactly', () => {
    expect(likePattern`${'O_Brien'}`).toBe('O\\_Brien');
  });

  it('stringifies non-string values', () => {
    expect(likePattern`%${['a', 'b']}%`).toBe('%a,b%');
    expect(likePattern`${42}%`).toBe('42%');
  });
});
