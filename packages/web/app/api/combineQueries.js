// Combines multiple react queries into one query object.
// Designed to be used with ReactQuery useQueries
export const combineQueries = (queries, options = {}) => {
  const { filterNoData = false } = options;
  const data = queries.map((query) => query.data ?? null);
  return {
    data: filterNoData ? data.filter(Boolean) : data,
    error: queries.find((q) => q.error)?.error ?? null,
    errors: queries.filter((q) => q.isError).map((q) => q.error),
    isError: queries.some((q) => q.isError),
    isFetched: queries.every((q) => q.isFetched),
    isFetchedAfterRemount: queries.every((q) => q.isFetchedAfterRemount),
    isFetching: queries.some((q) => q.isFetching),
    isInitialLoading: queries.some((q) => q.isInitialLoading),
    isLoading: queries.some((q) => q.isLoading),
    isLoadingError: queries.some((q) => q.isLoadingError),
    isPaused: queries.some((q) => q.isPaused),
    isPlaceholderData: queries.every((q) => q.isPlaceholderData),
    isPreviousData: queries.every((q) => q.isPreviousData),
    isRefetchError: queries.some((q) => q.isRefetchError),
    isRefetching: queries.some((q) => q.isRefetching),
    isStale: queries.some((q) => q.isStale),
    isSuccess: queries.length > 0 && queries.every((q) => q.isSuccess),
  };
};
