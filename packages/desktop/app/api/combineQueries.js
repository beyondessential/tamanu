// Combines multiple react queries into one query object.
// Designed to be used with ReactQuery useQueries
export const combineQueries = queries => ({
  isLoading: queries.some(q => q.isLoading),
  isFetching: queries.some(q => q.isFetching),
  isError: queries.some(q => q.isError),
  isSuccess: queries.length > 0 && queries.every(q => q.isSuccess),
  error: queries.find(q => q.error)?.error ?? null, // included for compatibility with base useQuery api
  errors: queries.filter(q => q.isError).map(q => q.error),
  data: queries.reduce(
    (accumulator, query) => (query.data ? [...accumulator, query.data] : accumulator),
    [],
  ),
});
