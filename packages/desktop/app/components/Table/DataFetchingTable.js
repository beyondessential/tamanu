import React, { useState, useCallback, useEffect, memo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { isEqual } from 'lodash';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Table } from './Table';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { ClearIcon } from '../Icons/ClearIcon';
import { RefreshIcon } from '../Icons/RefreshIcon';

const Notification = styled.div`
  background-color: ${Colors.primary}10;
  border: 1px solid ${Colors.primary}1a;
  border-radius: 4px;
  color: ${Colors.primary};

  height: 48px;
  line-height: 48px;
  width: 320px;
  padding-left: 15px;

  position: absolute;
  top: 28px;
  right: 35px;
  z-index: 9;
`;

const LastUpdatedBadge = styled.div`
  position: absolute;
  top: 120px;
  right: 35px;
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

const NotificationClearIcon = styled(ClearIcon)`
  position: absolute;
  right: 20px;
  top: 19px;
  cursor: pointer;
  path {
    fill: ${Colors.primary};
  }
`;

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const DEFAULT_SORT = { order: 'asc', orderBy: undefined };
const DEFAULT_FETCH_STATE = { data: [], count: 0, errorMessage: '', isLoading: true };

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

    // This group of states are for tracking the previous state of fetches and comparing to
    // the most recent one to determine which rows to highlight and when table data should update
    const [lastFetchCount, setLastFetchCount] = useState(0);
    const [lastPage, setLastPage] = useState(0);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(getCurrentDateTimeString());
    const [dataSnapshot, setDataSnapshot] = useState([]);

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

    const clearNewRowStyles = () => {
      setShowNotification(false);
      setNewRowCount(0);
    };

    const fetchOptionsString = JSON.stringify(fetchOptions);

    useEffect(() => {
      updateFetchState({ isLoading: true });
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

          const transformedData = transformRow ? data.map(transformRow) : data;

          if (enableAutoRefresh) {
            const isFirstFetch = lastFetchCount === 0; // Check if this is the intial table load
            const isInitialSort = isEqual(sorting, initialSort); // Check if set to initial sort
            const hasPageChanged = page !== lastPage; // Check if the page number has changed since the last fetch

            const rowsSinceRefresh = count - lastFetchCount; // Rows since the last autorefresh
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

            // If its the first fetch, we dont want to highlight the new rows green or show a notification
            if (!isFirstFetch) {
              setNewRowCount(rowsSinceInteraction);
              setShowNotification(rowsSinceInteraction > 0);
              if (lastPage === 0 && page > 0) {
                clearNewRowStyles();
              }
            }

            // When autorefreshing past page one, we dont want to move rows down as it updates. Only if you are on
            // page one should it live update, otherwise the updates come through when navigating
            const isDataToBeUpdated = hasPageChanged || page === 0;
            const displayData = isDataToBeUpdated ? highlightedData : dataSnapshot;

            // Record page and count of last fetch to compare to the next fetch. Also save a copy of current data to show if not updating
            setLastFetchCount(count);
            setLastPage(page);
            setDataSnapshot(displayData);
            setLastUpdatedAt(getCurrentDateTimeString());

            // Update the table with the rows to display
            updateFetchState({
              ...DEFAULT_FETCH_STATE,
              data: displayData,
              count,
              isLoading: false,
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
          console.error(error);
          updateFetchState({ errorMessage: error.message, isLoading: false });
        }
      })();

      // Check if autoregresh is enabled in config and that the autorefresh prop is added to table
      if (enableAutoRefresh) {
        const tableAutorefresh = setInterval(() => {
          refreshTable();
        }, autoRefresh.interval);

        return () => {
          clearInterval(tableAutorefresh);
        };
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

    const { data, count, isLoading, errorMessage } = fetchState;
    const { order, orderBy } = sorting;
    return (
      <>
        {showNotification && (
          <Notification>
            New requests available to view <NotificationClearIcon onClick={clearNewRowStyles} />
          </Notification>
        )}
        {enableAutoRefresh && (
          <LastUpdatedBadge>
            Last updated at: {lastUpdatedAt}
            <RefreshIcon onClick={refreshTable} />
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
