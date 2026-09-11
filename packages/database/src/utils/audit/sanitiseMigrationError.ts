export type MigrationErrorSummary = {
  code?: string;
  message: string;
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
  original?: PostgresErrorFields;
  parent?: PostgresErrorFields;
};

const MAX_MESSAGE_LENGTH = 500;

const blankQuotedLiterals = (message: string) =>
  message.replace(/"[^"]*"/g, '"…"').replace(/'[^']*'/g, "'…'");

// Postgres puts row contents in DETAIL and HINT, so only the fields below are ever copied.
export const sanitiseMigrationError = (error: MigrationFailure): MigrationErrorSummary => {
  const databaseError = error.original ?? error.parent;
  const { code, table, column, constraint } = databaseError ?? {};
  const message = blankQuotedLiterals(databaseError?.message ?? error.message).slice(
    0,
    MAX_MESSAGE_LENGTH,
  );

  if (!code) {
    return { name: error.name, message };
  }

  return {
    code,
    message,
    ...(table ? { table } : {}),
    ...(column ? { column } : {}),
    ...(constraint ? { constraint } : {}),
  };
};
