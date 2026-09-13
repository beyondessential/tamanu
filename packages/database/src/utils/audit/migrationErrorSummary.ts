export type MigrationErrorSummary = {
  code?: string;
  message?: string;
  detail?: string;
  hint?: string;
  table?: string;
  column?: string;
  constraint?: string;
  name?: string;
};

type PostgresErrorFields = {
  message?: string;
  code?: string;
  detail?: string;
  hint?: string;
  table?: string;
  column?: string;
  constraint?: string;
};

type MigrationFailure = Error & {
  code?: string;
  original?: PostgresErrorFields;
  parent?: PostgresErrorFields;
};

const SQLSTATE = /^[0-9A-Z]{5}$/;

const postgresFields = (error: MigrationFailure): PostgresErrorFields | undefined =>
  [error?.original, error?.parent, error].find(candidate => SQLSTATE.test(candidate?.code ?? ''));

// DETAIL names the offending row, which is the whole point: a deployment cannot work out what
// to fix before an upgrade from the constraint name alone. SQL and parameters stay out.
export const migrationErrorSummary = (error: MigrationFailure): MigrationErrorSummary => {
  const postgres = postgresFields(error);

  if (postgres) {
    const { code, message, detail, hint, table, column, constraint } = postgres;
    return {
      code,
      ...(message ? { message } : {}),
      ...(detail ? { detail } : {}),
      ...(hint ? { hint } : {}),
      ...(table ? { table } : {}),
      ...(column ? { column } : {}),
      ...(constraint ? { constraint } : {}),
    };
  }

  // Migration code can throw a string or a bare object, which names nothing.
  const message = typeof error === 'string' ? error : error?.message;
  return {
    name: error?.name ?? 'UnknownError',
    ...(message ? { message } : {}),
  };
};
