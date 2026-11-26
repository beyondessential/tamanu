const likeWildcards = /[\\%_]/g;

/**
 * Builds a LIKE/ILIKE pattern from a template whose own `%` and `_` are wildcards, matching every
 * interpolated value literally: likePattern`%${search}%` finds `search` anywhere, even when it
 * holds `%`, `_` or `\`.
 *
 * Values are escaped with a backslash, Postgres' default LIKE escape character. SQLite has no
 * default, so a SQLite query follows each LIKE using the pattern with {@link LIKE_ESCAPE_CLAUSE}.
 */
export const likePattern = (literals: TemplateStringsArray, ...values: unknown[]): string =>
  values.reduce<string>(
    // String() keeps repeated query params (arrays) matching as their joined form, e.g. 'a,b'
    (pattern, value, index) =>
      pattern + String(value).replace(likeWildcards, '\\$&') + literals[index + 1],
    literals[0],
  );

/** Declares likePattern's escape character, for SQL dialects without a default one (SQLite). */
export const LIKE_ESCAPE_CLAUSE = "ESCAPE '\\'";
