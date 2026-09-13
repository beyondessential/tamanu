export type MigrationErrorSummary = {
  code?: string;
  message?: string;
  table?: string;
  column?: string;
  constraint?: string;
  name?: string;
};

type PostgresErrorFields = {
  message?: string;
  code?: string;
  table?: string;
  column?: string;
  constraint?: string;
};

type MigrationFailure = Error & {
  code?: string;
  original?: PostgresErrorFields;
  parent?: PostgresErrorFields;
};

const MAX_MESSAGE_LENGTH = 500;

const SQLSTATE = /^[0-9A-Z]{5}$/;

// Messages these classes carry are written by the engine and name identifiers, never values.
const ENGINE_ERRORS = new Set([
  'EvalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
]);

const blankQuotedLiterals = (message: string) =>
  message.replace(/"[^"]*"/g, '"…"').replace(/'[^']*'/g, "'…'");

const shorten = (message: string) =>
  [...blankQuotedLiterals(message)].slice(0, MAX_MESSAGE_LENGTH).join('');

const postgresFields = (error: MigrationFailure): PostgresErrorFields | undefined =>
  [error.original, error.parent, error].find(candidate => SQLSTATE.test(candidate?.code ?? ''));

// Postgres puts row contents in DETAIL and HINT, so only the fields below are ever copied, and a
// message written by migration code is dropped whole because its contents cannot be known.
export const sanitiseMigrationError = (error: MigrationFailure): MigrationErrorSummary => {
  const postgres = postgresFields(error);

  if (postgres) {
    const { code, table, column, constraint, message } = postgres;
    return {
      code,
      ...(message ? { message: shorten(message) } : {}),
      ...(table ? { table } : {}),
      ...(column ? { column } : {}),
      ...(constraint ? { constraint } : {}),
    };
  }

  // Migration code can throw a string or a bare object, which names nothing.
  const name = error?.name ?? 'UnknownError';

  if (ENGINE_ERRORS.has(name)) {
    return { name, message: shorten(error.message) };
  }

  return { name };
};
