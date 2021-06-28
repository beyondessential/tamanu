export const makeFilter = (check, sql, transform) => {
  if (!check) return null;

  return {
    sql,
    transform,
  };
};
