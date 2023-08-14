import React, { useState, useCallback, useEffect, memo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { isEqual } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

import { getDateDisplay } from '../DateDisplay';
import { Table } from './Table';
import { RefreshIcon } from '../Icons/RefreshIcon';
import { TableNotification } from './TableNotification';

import { Colors } from '../../constants';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const RefreshButton = styled(RefreshIcon)`
  ${props =>
    props.$isSpinning
      ? css`
          animation: 1s linear ${spin} infinite;
        `
      : ''}
`;

const LastUpdatedBadge = styled.div`
  position: absolute;
  top: 120px;
  right: 45px;
  z-index: 9;
  color: ${Colors.softText};
  font-size: 11px;
  display: flex;
  align-items: center;
  svg {
    margin-left: 5px;
    cursor: pointer;
    border-radius: 3px;
    &:hover {
      background-color: ${Colors.softOutline};
    }
  }
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
    const [isRefreshSpinning, setIsRefreshSpinning] = useState(true);

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

    const clearNewRowStyles = () => {
      setShowNotification(false);
      setNewRowCount(0);
    };

    const spinRefreshButton = () => {
      setIsRefreshSpinning(true);
      setTimeout(() => {
        setIsRefreshSpinning(false);
      }, 1000);
    };

    const fetchOptionsString = JSON.stringify(fetchOptions);

    useEffect(() => {
      spinRefreshButton();
      const loadingTimeout = setTimeout(() => {
        updateFetchState({ isLoading: true });
      }, 1000);
      // TODO: Need to break apart this useEffect into smaller pieces
      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
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
          clearTimeout(loadingTimeout);

          const transformedData = transformRow ? data.map(transformRow) : data;

          if (enableAutoRefresh) {
            const { previousFetch } = fetchState;
            const isFirstFetch = previousFetch.count === 0; // Check if this is the intial table load
            const isInitialSort = isEqual(sorting, initialSort); // Check if set to initial sort
            const hasPageChanged = page !== previousFetch.page; // Check if the page number has changed since the last fetch
            const hasSortingChanged = !isEqual(sorting, previousFetch?.sorting); // Check if the sorting has changed since the last fetch
            const hasRecordCountIncreased = count > previousFetch.count; // Check if the record count has increased since the last fetch

            const rowsSinceRefresh = count - previousFetch.count; // Rows since the last autorefresh
            const rowsSinceInteraction = rowsSinceRefresh + newRowCount; // Rows added since last clearing of rows from interacting

            // Highlight rows green if the index is less that the index of rows since interaction AND its not the first fetch
            const highlightedData = transformedData.map((row, i) => {
              const actualIndex = i + page * rowsPerPage; // Offset the indexes based on pagination
              const isNewRow = actualIndex < rowsSinceInteraction && !isFirstFetch && isInitialSort;
              return {
                ...row,
                new: isNewRow,
              };
            });

            const isLeavingPageOne = previousFetch.page === 0 && page > 0;
            const isChangingFromInitialSort =
              isEqual(previousFetch.sorting, initialSort) && hasSortingChanged;

            // If its the first fetch, we dont want to highlight the new rows green or show a notification
            if (!isFirstFetch) {
              setNewRowCount(rowsSinceInteraction);
              if (hasRecordCountIncreased) setShowNotification(true);
              if (isLeavingPageOne || (page === 0 && isChangingFromInitialSort)) {
                clearNewRowStyles();
              }
            }

            // When autorefreshing past page one, we dont want to move rows down as it updates. Only if you are on
            // page one should it live update, otherwise the updates come through when navigating
            const isDataToBeUpdated = hasPageChanged || hasSortingChanged || page === 0;
            const displayData = isDataToBeUpdated ? highlightedData : previousFetch.dataSnapshot;

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
          // eslint-disable-next-line no-console
          clearTimeout(loadingTimeout);
          console.error(error);
          updateFetchState({ errorMessage: error.message, isLoading: false });
        }
      })();

      // Check if autoregresh is enabled in config and that the autorefresh prop is added to table
      if (enableAutoRefresh) {
        const tableAutorefresh = setInterval(() => refreshTable(), autoRefresh.interval);
        return () => clearInterval(tableAutorefresh);
      }

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
      <>
        {showNotification && (
          <TableNotification
            message="New records available to view"
            clearNotification={() => setShowNotification(false)}
          />
        )}
        {enableAutoRefresh && (
          <LastUpdatedBadge>
            Last updated: {getDateDisplay(previousFetch?.lastUpdatedAt, { showTime: true })}
            <RefreshButton $isSpinning={isRefreshSpinning} onClick={refreshTable} />
          </LastUpdatedBadge>
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
          rowStyle={row => (row.new ? 'background-color: #F8FFF8;' : '')}
          {...props}
        />
      </>
    );
  },
);
