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

export const makeSubstringTextFilterFactory = params => (paramKey, sqlField) => {
  if (!params[paramKey]) return null;

  return {
    sql: `UPPER(${sqlField}) LIKE UPPER(:${paramKey})`,
    transform: p => ({
      [paramKey]: `%${p[paramKey]}%`,
    }),
  };
};

// Escape wildcard characters _, % and backslash in pattern match
export const escapePatternWildcard = value => {
  return value.replace(/[_%\\]/g, '\\$1');
};

export const getWhereClausesAndReplacementsFromFilters = (allFilters, params) => {
  const filters = allFilters.filter(f => f);
  const whereClauses = filters.map(f => f.sql).join(' AND ');
  const filterReplacements = filters
    .filter(f => f.transform)
    .reduce(
      (current, { transform }) => ({
        ...current,
        ...transform(current),
      }),
      params,
    );

  return { whereClauses, filterReplacements };
};
