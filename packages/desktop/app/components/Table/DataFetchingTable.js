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
  isLoading: true,
  previousFetch: {
    page: 0,
    count: 0,
    dataSnapshot: [],
    lastUpdatedAt: getCurrentDateTimeString(),
  },
  isLoadingMoreData: false,
  fetchOptions: {},
};

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
    ...props
  }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
    const [sorting, setSorting] = useState(initialSort);
    const [fetchState, setFetchState] = useState(DEFAULT_FETCH_STATE);
    const [forcedRefreshCount, setForcedRefreshCount] = useState(0);

    const [newRowCount, setNewRowCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [isNotificationMuted, setIsNotificationMuted] = useState(false);

    const api = useApi();

    const { getLocalisation } = useLocalisation();
    const autoRefresh = getLocalisation('features.tableAutorefresh');
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

    const loadingIndicatorDelay = () => {
      return setTimeout(() => {
        updateFetchState({ isLoading: true });
      }, 1000);
    };

    const fetchOptionsString = JSON.stringify(fetchOptions);

    useEffect(() => {
      if (fetchState.data?.length > 0 && lazyLoading) {
        updateFetchState({ isLoadingMoreData: true });
      } else {
        updateFetchState({ isLoading: true });
      }
      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
          const { data, count } = await fetchData();
          // clearTimeout(loadingDelay);

          const transformedData = transformRow ? data.map(transformRow) : data;

          // When fetch option is no longer the same (eg: filter changed), it should reload the entire table
          // instead of keep adding data for lazy loading
          const shouldReloadLazyLoadingData = !isEqual(fetchState.fetchOptions, fetchOptions);

          const updatedData =
            lazyLoading && !shouldReloadLazyLoadingData
              ? [...(fetchState?.data || []), ...(transformedData || [])]
              : transformedData;

          if (enableAutoRefresh) {
            // TODO: extract as much of this into a custom hook as possible
            const { previousFetch } = fetchState;
            const isFirstFetch = previousFetch.count === 0;
            const isInitialSort = isEqual(sorting, initialSort);

            const hasPageChanged = page !== previousFetch.page;
            const hasSortingChanged = !isEqual(sorting, previousFetch?.sorting);
            const hasSearchChanged = !isEqual(fetchOptions, previousFetch?.fetchOptions);

            const rowsSinceInteraction = count - previousFetch.count + newRowCount;

            const isLeavingPageOne = previousFetch.page === 0 && page > 0;
            const isChangingFromInitialSort =
              isEqual(previousFetch.sorting, initialSort) && hasSortingChanged;

            // When autorefreshing past page one, we dont want to move rows down as it updates. Only if you are on
            // page one sorted reverse chronologically should it live update, otherwise the updates come through when navigating/sorting
            const isLiveUpdating = !isFirstFetch && isInitialSort && !hasSearchChanged;
            const highlightedData = isLiveUpdating
              ? highlightDataRows(updatedData, rowsSinceInteraction)
              : transformedData;
            const isDataToBeUpdated = hasPageChanged || hasSortingChanged || page === 0;
            const displayData = isDataToBeUpdated ? highlightedData : previousFetch.dataSnapshot;
            const shouldResetRows =
              (isLeavingPageOne && isInitialSort) ||
              (page === 0 && isChangingFromInitialSort) ||
              hasSearchChanged;

            if (count > previousFetch.count) {
              setIsNotificationMuted(false);
            }

            if (!isFirstFetch) {
              setNewRowCount(rowsSinceInteraction);
              setShowNotification(rowsSinceInteraction > 0 && !(page === 0 && isInitialSort));
              if (shouldResetRows) {
                setShowNotification(false);
                setNewRowCount(0);
              }
            }

            updateFetchState({
              ...DEFAULT_FETCH_STATE,
              data: displayData,
              count,
              isLoading: false,
              // Record page and count of last fetch to compare to the next fetch. Also save a copy of current data to show if not updating
              previousFetch: {
                page,
                count,
                dataSnapshot: displayData,
                lastUpdatedAt: getCurrentDateTimeString(),
                sorting,
                fetchOptions,
              },
              isLoadingMoreData: false,
              fetchOptions,
            });
          } else {
            // Non autorefreshing table
            updateFetchState({
              ...DEFAULT_FETCH_STATE,
              data: updatedData,
              count,
              isLoading: false,
            });
            // Use custom function on data if provided
            if (onDataFetched) {
              onDataFetched({
                data: updatedData,
                count,
              });
            }
          }
        } catch (error) {
          // clearTimeout(loadingDelay);
          // eslint-disable-next-line no-console
          console.error(error);
          updateFetchState({
            errorMessage: error.message,
            isLoading: false,
            isLoadingMoreData: false,
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

    const { data, count, isLoading, isLoadingMoreData, errorMessage, previousFetch } = fetchState;
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
