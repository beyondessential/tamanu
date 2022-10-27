// Default needs to be declared inside anonymous function otherwise it will
// simply use the value returned on init.
// https://github.com/typeorm/typeorm/issues/877#issuecomment-772051282
export const ISO9075_SQLITE_DEFAULT = (): string => 'datetime(CURRENT_TIMESTAMP)';
export const ISO9075_DATE_SQLITE_DEFAULT = (): string => 'date(CURRENT_TIMESTAMP)';
