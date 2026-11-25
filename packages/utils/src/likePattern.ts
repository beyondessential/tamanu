/**
 * Builds a LIKE/ILIKE pattern from a template whose own `%` and `_` are wildcards, matching every
 * interpolated value literally: likePattern`%${search}%` finds `search` anywhere, even when it
 * holds `%`, `_` or `\`.
 *
 * Values are escaped with a backslash, Postgres' default LIKE escape character. SQLite has no
 * default, so a SQLite query follows each LIKE using the pattern with {@link LIKE_ESCAPE_CLAUSE}.
 */
export function likePattern(
  literals: TemplateStringsArray,
  ...values: (string | number)[]
): string {
  const escapedValues = values.map(value => value.toString().replace(/[\\%_]/g, '\\$&'));
  // String.raw interleaves the strings it is given as `raw` with the values, changing neither
  return String.raw({ raw: literals }, ...escapedValues);
}

/** Declares likePattern's escape character, for SQL dialects without a default one (SQLite). */
export const LIKE_ESCAPE_CLAUSE = "ESCAPE '\\'";
