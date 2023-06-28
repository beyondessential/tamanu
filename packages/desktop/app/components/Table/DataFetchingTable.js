import React, { useState, useCallback, useEffect, memo } from 'react';
import styled from 'styled-components';
import { Table } from './Table';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { ClearIcon } from '../Icons/ClearIcon';

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
    const [lastFetchCount, setLastFetchCount] = useState(0);
    const [newRowCount, setNewRowCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const api = useApi();
    const { getLocalisation } = useLocalisation();

    const autoRefresh = getLocalisation('features.tableAutorefresh');

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

    const clearNotification = () => {
      setShowNotification(false);
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

          // Here we add the light green background to new rows since last refresh to give visual feedback
          const isFirstFetch = lastFetchCount === 0;
          // Rows since the last autorefresh
          const rowsSinceRefresh = count - lastFetchCount;
          // Rows added since last clicked out of page or into imaging request
          const rowsSinceInteraction = rowsSinceRefresh + newRowCount;
          // Add new key that determines if the row is highlighted green or now
          const dataWithStyles = data.map((row, i) => {
            const actualIndex = i + page * rowsPerPage;
            const isNewRow = actualIndex < rowsSinceInteraction && !isFirstFetch;
            return {
              ...row,
              new: isNewRow,
            };
          });

          if (!isFirstFetch) {
            setNewRowCount(rowsSinceInteraction);
            setShowNotification(rowsSinceInteraction > 0 && page !== 0);
          }
          setLastFetchCount(count);

          const transformedData = transformRow ? dataWithStyles.map(transformRow) : dataWithStyles;
          updateFetchState({
            ...DEFAULT_FETCH_STATE,
            data: transformedData,
            count,
            isLoading: false,
          });
          if (onDataFetched) {
            onDataFetched({
              data: transformedData,
              count,
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(error);
          updateFetchState({ errorMessage: error.message, isLoading: false });
        }
      })();

      // Check if autoregresh is enabled in config and that the autorefresh prop is added to table
      if (autoRefresh && autoRefresh.enabled && isAutoRefreshTable) {
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
            New requests available to view <NotificationClearIcon onClick={clearNotification} />
          </Notification>
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
