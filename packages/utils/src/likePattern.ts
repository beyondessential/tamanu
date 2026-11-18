const likeWildcards = /[\\%_]/g;

/**
 * Builds a LIKE/ILIKE pattern from a template whose own `%` and `_` are wildcards, matching every
 * interpolated value literally: likePattern`%${search}%` finds `search` anywhere, even when it
 * holds `%`, `_` or `\`.
 *
 * Values are escaped with a backslash, Postgres' default LIKE escape character. SQLite has no
 * default, so a SQLite query using the pattern declares it with `ESCAPE '\'`.
 */
export const likePattern = (literals: TemplateStringsArray, ...values: unknown[]): string =>
  values.reduce<string>(
    // String() keeps repeated query params (arrays) matching as their joined form, e.g. 'a,b'
    (pattern, value, index) =>
      pattern + String(value).replace(likeWildcards, '\\$&') + literals[index + 1],
    literals[0],
  );
