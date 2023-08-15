import React, { useState, useCallback, useEffect, memo } from 'react';
import styled from 'styled-components';
import { isEqual } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

import { Table } from './Table';
import { TableNotification } from './TableNotification';
import { TableRefreshButton } from './TableRefreshButton';

const TableContainer = styled.div`
  position: relative;
`;

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
    ...props
  }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
    const [sorting, setSorting] = useState(initialSort);
    const [fetchState, setFetchState] = useState(DEFAULT_FETCH_STATE);
    const [forcedRefreshCount, setForcedRefreshCount] = useState(0);

    const [newRowCount, setNewRowCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);

    const api = useApi();

    const { getLocalisation } = useLocalisation();
    const autoRefresh = getLocalisation('features.tableAutorefresh');
    const enableAutoRefresh = autoRefresh && autoRefresh.enabled && isAutoRefreshTable;

    // This callback will be passed to table cell accessors so they can force a table refresh
    const refreshTable = useCallback(() => {
      setForcedRefreshCount(prevCount => prevCount + 1);
    }, []);

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
      const loadingDelay = loadingIndicatorDelay();
      // TODO: Need to break apart this useEffect into smaller pieces
      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
          const { data, count } = await fetchData();
          clearTimeout(loadingDelay);

          const transformedData = transformRow ? data.map(transformRow) : data;

          if (enableAutoRefresh) {
            const { previousFetch } = fetchState;
            const isFirstFetch = previousFetch.count === 0;
            const isInitialSort = isEqual(sorting, initialSort);

            const hasPageChanged = page !== previousFetch.page;
            const hasSortingChanged = !isEqual(sorting, previousFetch?.sorting);
            const hasRecordCountIncreased = count > previousFetch.count;
            const hasSearchChanged = !isEqual(fetchOptions, previousFetch?.fetchOptions);

            const isLiveUpdating = !isFirstFetch && isInitialSort && !hasSearchChanged;

            const rowsSinceRefresh = count - previousFetch.count;
            const rowsSinceInteraction = rowsSinceRefresh + newRowCount;

            const isLeavingPageOne = previousFetch.page === 0 && page > 0;
            const isChangingFromInitialSort =
              isEqual(previousFetch.sorting, initialSort) && hasSortingChanged;

            // Highlight rows green if the index is less that the index of rows since interaction AND its not the first fetch
            const highlightedData = isLiveUpdating
              ? highlightDataRows(transformedData, rowsSinceInteraction)
              : transformedData;

            // When autorefreshing past page one, we dont want to move rows down as it updates. Only if you are on
            // page one should it live update, otherwise the updates come through when navigating
            const isDataToBeUpdated = hasPageChanged || hasSortingChanged || page === 0;
            const displayData = isDataToBeUpdated ? highlightedData : previousFetch.dataSnapshot;

            // If its the first fetch, we dont want to highlight the new rows green or show a notification
            if (!isFirstFetch) {
              if (
                isLeavingPageOne ||
                (page === 0 && isChangingFromInitialSort) ||
                hasSearchChanged
              ) {
                setShowNotification(false);
                setNewRowCount(0);
              } else {
                setNewRowCount(rowsSinceInteraction);
                if (hasRecordCountIncreased) setShowNotification(true);
              }
            }

            // Update the table with the rows to display
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
            });
          } else {
            // Non autorefreshing table
            updateFetchState({
              ...DEFAULT_FETCH_STATE,
              data: transformedData,
              count,
              isLoading: false,
            });
            // Use custom function on data if provided
            if (onDataFetched) {
              onDataFetched({
                data: transformedData,
                count,
              });
            }
          }
        } catch (error) {
          clearTimeout(loadingDelay);
          // eslint-disable-next-line no-console
          console.error(error);
          updateFetchState({ errorMessage: error.message, isLoading: false });
        }
      })();

      // Check if autoregresh is enabled in config and that the autorefresh prop is added to table
      if (enableAutoRefresh) {
        const tableAutorefresh = setInterval(() => refreshTable(), autoRefresh.interval);
        return () => clearInterval(tableAutorefresh);
      }

      return () => {};

      // Needed to compare fetchOptions as a string instead of an object
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      api,
      endpoint,
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

    const { data, count, isLoading, errorMessage, previousFetch } = fetchState;
    const { order, orderBy } = sorting;
    return (
      <TableContainer>
        {showNotification && (
          <TableNotification
            message="New records available to view"
            clearNotification={() => setShowNotification(false)}
          />
        )}
        {enableAutoRefresh && (
          <TableRefreshButton
            lastUpdatedTime={previousFetch?.lastUpdatedAt}
            refreshTable={refreshTable}
          />
        )}
        <Table
          isLoading={isLoading}
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
          {...props}
        />
      </TableContainer>
    );
  },
);
