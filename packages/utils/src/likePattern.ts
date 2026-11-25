/**
 * Builds a LIKE/ILIKE pattern from a template whose own `%` and `_` are wildcards, matching every
 * interpolated value literally: likePattern`%${search}%` finds `search` anywhere, even when it
 * holds `%`, `_` or `\`.
 *
 * Postgres only: values are escaped with a backslash, Postgres' default LIKE escape character.
 * SQLite has no default, so there the backslashes would be matched as literal characters.
 */
export function likePattern(
  literals: TemplateStringsArray,
  ...values: (string | number)[]
): string {
  const escaped = values.map(value => value.toString().replace(/[\\%_]/g, '\\$&'));
  return String.raw({ raw: literals }, ...escaped);
}
