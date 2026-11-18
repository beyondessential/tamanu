import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { LIKE_ESCAPE_CLAUSE, likePattern } from '../src/likePattern';

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

describe('LIKE_ESCAPE_CLAUSE', () => {
  const matches = (value: string, pattern: string) => {
    const database = new DatabaseSync(':memory:');
    const { matched } = database
      .prepare(`SELECT ? LIKE ? ${LIKE_ESCAPE_CLAUSE} AS matched`)
      .get(value, pattern) as { matched: number };
    database.close();
    return matched === 1;
  };

  it('makes SQLite match interpolated values literally', () => {
    expect(matches('Under_score', likePattern`%${'_'}%`)).toBe(true);
    expect(matches('Plain', likePattern`%${'_'}%`)).toBe(false);
    expect(matches('50% off', likePattern`${'50%'}%`)).toBe(true);
    expect(matches('500 off', likePattern`${'50%'}%`)).toBe(false);
    expect(matches('a\\b', likePattern`%${'\\'}%`)).toBe(true);
  });
});
