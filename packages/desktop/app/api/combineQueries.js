// Combines multiple react queries into one query object.
// Designed to be used with ReactQuery useQueries
export const combineQueries = (queries, options = {}) => {
  const { filterNoData = false } = options;
  const data = queries.map(query => query.data ?? null);
  return {
    isLoading: queries.some(q => q.isLoading),
    isFetching: queries.some(q => q.isFetching),
    isError: queries.some(q => q.isError),
    isSuccess: queries.length > 0 && queries.every(q => q.isSuccess),
    error: queries.find(q => q.error)?.error ?? null,
    errors: queries.filter(q => q.isError).map(q => q.error),
    data: filterNoData ? data.filter(Boolean) : data,
  };
};
