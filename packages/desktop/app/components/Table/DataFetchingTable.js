import React, { useState, useCallback, useEffect, memo } from 'react';
import { isEqual } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

import { Table } from './Table';
import { TableNotification } from './TableNotification';
import { TableRefreshButton } from './TableRefreshButton';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_SORT = { order: 'asc', orderBy: undefined };
const DEFAULT_FETCH_STATE = {
  data: [],
  count: 0,
  errorMessage: '',
};
const initialisePreviousFetch = () => ({
  page: 0,
  count: 0,
  dataSnapshot: [],
  lastUpdatedAt: getCurrentDateTimeString(),
  sorting: DEFAULT_SORT,
  fetchOptions: {},
});

export const DataFetchingTable = memo(
  ({
    fetchOptions,
    endpoint,
    transformRow,
    initialSort = DEFAULT_SORT,
    refreshCount = 0,
    onDataFetched,
    disablePagination = false,
    autoRefresh: isAutoRefreshTable,
    lazyLoading = false,
    overrideLocalisationForStorybook = false,
    ...props
  }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
    const [sorting, setSorting] = useState(initialSort);
    const [fetchState, setFetchState] = useState(DEFAULT_FETCH_STATE);
    const [forcedRefreshCount, setForcedRefreshCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMoreData, setIsLoadingMoreData] = useState(false);
    const [previousFetch, setPreviousFetch] = useState(initialisePreviousFetch());

    const [newRowCount, setNewRowCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [isNotificationMuted, setIsNotificationMuted] = useState(false);

    const api = useApi();

    const { getLocalisation } = useLocalisation();
    const autoRefresh =
      overrideLocalisationForStorybook || getLocalisation('features.tableAutorefresh');
    const enableAutoRefresh = autoRefresh && autoRefresh.enabled && isAutoRefreshTable;

    // This callback will be passed to table cell accessors so they can force a table refresh
    const refreshTable = useCallback(() => {
      setForcedRefreshCount(prevCount => prevCount + 1);
    }, []);

    const manualRefresh = useCallback(() => {
      setSorting(initialSort);
      setPage(0);
      refreshTable();
    }, [initialSort, refreshTable]);

    const handleChangeOrderBy = useCallback(
      columnKey => {
        const { order, orderBy } = sorting;
        const isDesc = orderBy === columnKey && order === 'desc';
        const newSorting = { order: isDesc ? 'asc' : 'desc', orderBy: columnKey };
        setSorting(newSorting);
      },
      [sorting],
    );

    const updateFetchState = useCallback(newFetchState => {
      setFetchState(oldFetchState => ({ ...oldFetchState, ...newFetchState }));
    }, []);

    const fetchData = async () => {
      const { data, count } = await api.get(
        endpoint,
        {
          page,
          ...(!disablePagination ? { rowsPerPage } : {}),
          ...sorting,
          ...fetchOptions,
        },
        {
          showUnknownErrorToast: false,
        },
      );
      return { data, count };
    };

    const highlightDataRows = (data, newRows) => {
      const highlightedData = data.map((row, i) => {
        const actualIndex = i + page * rowsPerPage; // Offset the indexes based on pagination
        const isHighlighted = actualIndex < newRows;
        return {
          ...row,
          highlighted: isHighlighted,
        };
      });
      return highlightedData;
    };

    const updatePreviousFetchState = useCallback(
      (data, count) => {
        setPreviousFetch({
          page,
          count,
          dataSnapshot: data,
          lastUpdatedAt: getCurrentDateTimeString(),
          sorting,
          fetchOptions,
        });
      },
      [fetchOptions, page, sorting],
    );

    const loadingIndicatorDelay = () => {
      return setTimeout(() => {
        if (fetchState.data?.length > 0 && lazyLoading) {
          setIsLoadingMoreData(true);
        } else {
          setIsLoading(true);
        }
      }, 1000);
    };

    const clearLoadingIndicators = () => {
      setIsLoading(false);
      setIsLoadingMoreData(false);
    };

    const fetchOptionsString = JSON.stringify(fetchOptions);

    const updateTableWithData = useCallback(
      (data, count) => {
        clearLoadingIndicators();
        updatePreviousFetchState(data, count);
        updateFetchState({
          ...DEFAULT_FETCH_STATE,
          data,
          count,
        });

        // Use custom function on data if provided
        if (onDataFetched) {
          onDataFetched({
            data,
            count,
          });
        }
      },
      [onDataFetched, updateFetchState, updatePreviousFetchState],
    );

    const transformData = (data, count) => {
      const transformedData = transformRow ? data.map(transformRow) : data;
      const hasSearchChanged = !isEqual(fetchOptions, previousFetch?.fetchOptions);

      // When fetch option is no longer the same (eg: filter changed), it should reload the entire table
      // instead of keep adding data for lazy loading
      if (lazyLoading && !hasSearchChanged) {
        return [...(fetchState.data || []), ...(transformedData || [])];
      }

      if (!enableAutoRefresh) {
        return transformedData;
      }

      // Autorefresh calculations follow this point
      // only notify if there's more *new* unviewed rows
      // (rather than rows that still haven't been viewed from a previous fetch)
      if (count > previousFetch.count) setIsNotificationMuted(false);

      const isInitialSort = isEqual(sorting, initialSort);
      const hasSortingChanged = !isEqual(sorting, previousFetch?.sorting);

      const getShouldResetRowHighlighting = () => {
        if (previousFetch.count === 0) return true; // first fetch never needs a highlight
        if (hasSearchChanged) return true; // if search changed reset highlighting

        const isLeavingPageOne = previousFetch.page === 0 && page > 0;
        const isChangingFromInitialSort =
          isEqual(previousFetch.sorting, initialSort) && hasSortingChanged;

        if (isLeavingPageOne && isInitialSort) return true; // if leaving page one when green rows visible, reset highlighting
        if (page === 0 && isChangingFromInitialSort) return true; // if changing sort on page one when green rows visible, reset highlighting

        return false;
      };

      if (getShouldResetRowHighlighting()) {
        setShowNotification(false);
        setNewRowCount(0);
        return transformedData;
      }

      const rowsSinceInteraction = count - previousFetch.count + newRowCount; // these are the rows since the user interacted with the app (reset row styling)
      setShowNotification(rowsSinceInteraction > 0 && !(page === 0 && isInitialSort)); // Only show notification when green rows not visible
      setNewRowCount(rowsSinceInteraction);

      const hasPageChanged = page !== previousFetch.page;
      const isDataToBeUpdated = hasPageChanged || hasSortingChanged || page === 0;
      const highlightStartIndex = isInitialSort ? rowsSinceInteraction : 0;

      const displayData = isDataToBeUpdated
        ? highlightDataRows(transformedData, highlightStartIndex)
        : previousFetch.dataSnapshot; // Show the previous fetches data snapshot if the data is not to be updated

      return displayData;
    };

    useEffect(() => {
      const loadingDelay = loadingIndicatorDelay();
      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
          const { data, count } = await fetchData();
          clearTimeout(loadingDelay); // Clear the loading indicator timeout if data fetched before 1 second passes (stops flash from short loading time)

          const transformedData = transformData(data, count); // Transform the data before updating the table rows
          updateTableWithData(transformedData, count); // Set the data for table rows and update the previous fetch state
        } catch (error) {
          clearTimeout(loadingDelay);
          clearLoadingIndicators();
          // eslint-disable-next-line no-console
          console.error(error);
          updateFetchState({
            errorMessage: error.message,
          });
        }
      })();

      if (enableAutoRefresh) {
        const tableAutorefresh = setInterval(() => refreshTable(), autoRefresh.interval);
        return () => clearInterval(tableAutorefresh);
      }
      return () => {}; // Needed to add return due to the conditional return above

      // Needed to compare fetchOptions as a string instead of an object
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      api,
      endpoint,
      lazyLoading,
      page,
      rowsPerPage,
      sorting,
      fetchOptionsString,
      refreshCount,
      forcedRefreshCount,
      transformRow,
      onDataFetched,
      updateFetchState,
      disablePagination,
    ]);

    useEffect(() => setPage(0), [fetchOptions]);

    const { data, count, errorMessage } = fetchState;
    const { order, orderBy } = sorting;

    const notificationMessage = `${newRowCount} new record${
      newRowCount > 1 ? 's' : ''
    } available to view`;
    return (
      <>
        {!isNotificationMuted && showNotification && (
          <TableNotification
            message={notificationMessage}
            clearNotification={() => {
              setShowNotification(false);
              setIsNotificationMuted(true);
            }}
          />
        )}
        {enableAutoRefresh && (
          <TableRefreshButton
            lastUpdatedTime={previousFetch?.lastUpdatedAt}
            refreshTable={manualRefresh}
          />
        )}
        <Table
          isLoading={isLoading}
          isLoadingMoreData={isLoadingMoreData}
          data={data}
          errorMessage={errorMessage}
          rowsPerPage={rowsPerPage}
          page={disablePagination ? null : page}
          count={count}
          onChangePage={setPage}
          onChangeRowsPerPage={setRowsPerPage}
          onChangeOrderBy={handleChangeOrderBy}
          order={order}
          orderBy={orderBy}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          refreshTable={refreshTable}
          rowStyle={row => (row.highlighted ? 'background-color: #F8FFF8;' : '')}
          lazyLoading={lazyLoading}
          {...props}
        />
      </>
    );
  },
);
