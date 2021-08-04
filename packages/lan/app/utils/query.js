export const makeFilter = (check, sql, transform) => {
  if (!check) return null;

  return {
    sql,
    transform,
  };
};

export const makeSimpleTextFilterFactory = params => (paramKey, sqlField) => {
  if (!params[paramKey]) return null;

  return {
    sql: `UPPER(${sqlField}) LIKE UPPER(:${paramKey})`,
    transform: p => ({
      [paramKey]: `${p[paramKey]}%`,
    }),
  };
};
