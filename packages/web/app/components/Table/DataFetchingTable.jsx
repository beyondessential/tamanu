import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { useApi } from '../../api';

import { Table } from './Table';
import { TableNotification } from './TableNotification';
import { TableRefreshButton } from './TableRefreshButton';
import { TranslatedText } from '../Translation/TranslatedText';
import { withPermissionCheck } from '../withPermissionCheck';
import { useSettings } from '../../contexts/Settings';
import { ROWS_PER_PAGE_OPTIONS } from '../../constants';

const DEFAULT_SORT = { order: 'asc', orderBy: undefined };

const initialiseFetchState = (lastUpdatedAt = '') => ({
  page: 0,
  count: 0,
  data: [],
  lastUpdatedAt,
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
    autoRefresh,
    lazyLoading = false,
    overrideLocalisationForStorybook = false,
    hasPermission = true,
    defaultRowsPerPage = ROWS_PER_PAGE_OPTIONS[0],
    'data-testid': dataTestId,
    ...props
  }) => {
    const { getCurrentDateTime } = useDateTimeFormat();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
    const [sorting, setSorting] = useState(initialSort);
    const [fetchState, setFetchState] = useState(() => initialiseFetchState(getCurrentDateTime()));
    const [forcedRefreshCount, setForcedRefreshCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMoreData, setIsLoadingMoreData] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [newRowCount, setNewRowCount] = useState(0);
    const [showNotification, setShowNotification] = useState(false);
    const [isNotificationMuted, setIsNotificationMuted] = useState(false);

    const tableRef = useRef(null);
    const api = useApi();

    const { getSetting } = useSettings();
    const autoRefreshConfig =
      overrideLocalisationForStorybook || getSetting('features.tableAutoRefresh');
    const enableAutoRefresh = autoRefreshConfig && autoRefreshConfig.enabled && autoRefresh;

    // This callback will be passed to table cell accessors so they can force a table refresh
    const refreshTable = useCallback(() => {
      setForcedRefreshCount((prevCount) => prevCount + 1);
    }, []);

    const manualRefresh = useCallback(() => {
      setSorting(initialSort);
      setPage(0);
      refreshTable();
    }, [initialSort, refreshTable]);

    const handleChangeOrderBy = useCallback(
      (columnKey) => {
        const { order, orderBy } = sorting;
        const isDesc = orderBy === columnKey && order === 'desc';
        const newSorting = { order: isDesc ? 'asc' : 'desc', orderBy: columnKey };
        setSorting(newSorting);
        setPage(0);
      },
      [sorting],
    );

    const fetchData = async () => {
      const { data, count, ...rest } = await api.get(
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
      return { data, count, ...rest };
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

    const getCurrentDateTimeRef = useRef(getCurrentDateTime);
    getCurrentDateTimeRef.current = getCurrentDateTime;

    const updateFetchState = useCallback(
      (data, count) => {
        setFetchState({
          page,
          count,
          data,
          lastUpdatedAt: getCurrentDateTimeRef.current(),
          sorting,
          fetchOptions,
        });
      },
      [fetchOptions, page, sorting],
    );

    const loadingIndicatorDelay = () =>
      setTimeout(() => {
        setIsLoading(true);
      }, 1000);

    const clearLoadingIndicators = () => {
      setIsLoading(false);
      setIsLoadingMoreData(false);
    };

    const fetchOptionsString = JSON.stringify(fetchOptions);

    const updateTableWithData = useCallback(
      (data, count, otherData) => {
        clearLoadingIndicators();
        updateFetchState(data, count);

        // Use custom function on data if provided
        if (onDataFetched) {
          onDataFetched({
            data,
            count,
            otherData,
          });
        }
      },
      [onDataFetched, updateFetchState],
    );

    const transformData = (data, count) => {
      const transformedData = transformRow ? data.map(transformRow) : data;
      const hasSearchChanged = !isEqual(fetchOptions, fetchState?.fetchOptions);
      const hasSortingChanged = !isEqual(sorting, fetchState?.sorting);

      if (lazyLoading && hasSearchChanged) {
        // eslint-disable-next-line no-unused-expressions
        tableRef?.current?.scroll({ top: 0 });
      }

      // When fetch option is no longer the same (eg: filter changed), it should reload the entire table
      // instead of keep adding data for lazy loading
      if (lazyLoading && !hasSearchChanged && !hasSortingChanged) {
        return [...(fetchState.data || []), ...(transformedData || [])];
      }

      if (!enableAutoRefresh) {
        return transformedData;
      }

      // Autorefresh calculations follow this point
      // only notify if there's more *new* unviewed rows
      // (rather than rows that still haven't been viewed from a previous fetch)
      if (count > fetchState.count) setIsNotificationMuted(false);

      const isInitialSort = isEqual(sorting, initialSort);

      const getShouldResetRowHighlighting = () => {
        if (fetchState.count === 0) return true; // first fetch never needs a highlight
        if (hasSearchChanged) return true; // if search changed reset highlighting

        const isLeavingPageOne = fetchState.page === 0 && page > 0;
        const isChangingFromInitialSort =
          isEqual(fetchState.sorting, initialSort) && hasSortingChanged;

        if (isLeavingPageOne && isInitialSort) return true; // if leaving page one when green rows visible, reset highlighting
        if (page === 0 && isChangingFromInitialSort) return true; // if changing sort on page one when green rows visible, reset highlighting

        return false;
      };

      if (getShouldResetRowHighlighting()) {
        setShowNotification(false);
        setNewRowCount(0);
        return transformedData;
      }

      const rowsSinceInteraction = count - fetchState.count + newRowCount; // these are the rows since the user interacted with the app (reset row styling)
      setShowNotification(rowsSinceInteraction > 0 && !(page === 0 && isInitialSort)); // Only show notification when green rows not visible
      setNewRowCount(rowsSinceInteraction);

      const hasPageChanged = page !== fetchState.page;
      const isDataToBeUpdated = hasPageChanged || hasSortingChanged || page === 0;
      const rowsToHighlight = isInitialSort ? rowsSinceInteraction : 0;

      const displayData = isDataToBeUpdated
        ? highlightDataRows(transformedData, rowsToHighlight)
        : fetchState.data; // Show the previous fetches data snapshot if the data is not to be updated

      return displayData;
    };

    useEffect(() => {
      if (!hasPermission) return;

      const shouldLoadMoreData = fetchState.data?.length > 0 && lazyLoading;

      if (shouldLoadMoreData) setIsLoadingMoreData(true);
      const loadingDelay = !shouldLoadMoreData && loadingIndicatorDelay();

      (async () => {
        try {
          if (!endpoint) {
            throw new Error('Missing endpoint to fetch data.');
          }
          setErrorMessage('');
          const { data, count, ...rest } = await fetchData();

          if (loadingDelay) clearTimeout(loadingDelay); // Clear the loading indicator timeout if data fetched before 1 second passes (stops flash from short loading time)

          const transformedData = transformData(data, count); // Transform the data before updating the table rows
          updateTableWithData(transformedData, count, rest); // Set the data for table rows and update the previous fetch state
        } catch (error) {
          clearTimeout(loadingDelay);
          clearLoadingIndicators();
          // eslint-disable-next-line no-console
          console.error(error);
          setErrorMessage(error.message);
        }
      })();

      if (enableAutoRefresh) {
        const tableAutorefresh = setInterval(
          () => refreshTable(),
          autoRefreshConfig.interval * 1000,
        );
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
      disablePagination,
      hasPermission,
    ]);

    useEffect(() => {
      setPage(0);
      setFetchState(initialiseFetchState(getCurrentDateTimeRef.current()));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchOptionsString]);

    const { data, count, lastUpdatedAt } = fetchState;
    const { order, orderBy } = sorting;

    const notificationMessage = `${newRowCount} new record${
      newRowCount > 1 ? 's' : ''
    } available to view`;

    if (!hasPermission) {
      return (
        <Table
          columns={[]}
          errorMessage={
            <TranslatedText
              stringId="general.table.error.noPermission"
              fallback="You do not have permission to view this table. If you require access, please contact your administrator."
              data-testid="translatedtext-r2tx"
            />
          }
          data-testid={dataTestId}
        />
      );
    }

    return (
      <>
        {!isNotificationMuted && showNotification && (
          <TableNotification
            message={notificationMessage}
            refreshTable={manualRefresh}
            clearNotification={() => {
              setShowNotification(false);
              setIsNotificationMuted(true);
            }}
            data-testid={`${dataTestId}-notification`}
          />
        )}
        {enableAutoRefresh && (
          <TableRefreshButton
            lastUpdatedTime={lastUpdatedAt}
            refreshTable={manualRefresh}
            data-testid={`${dataTestId}-refresh`}
          />
        )}
        <Table
          isLoading={isLoading}
          isLoadingMore={isLoadingMoreData}
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
          rowStyle={(row) => {
            const rowStyle = [];
            if (row.highlighted) rowStyle.push('background-color: #F0FFF0;');
            if (props.isRowsDisabled) rowStyle.push('cursor: not-allowed;');
            return rowStyle.join('');
          }}
          lazyLoading={lazyLoading}
          ref={tableRef}
          {...props}
          data-testid={dataTestId}
        />
      </>
    );
  },
);

export const DataFetchingTableWithPermissionCheck = withPermissionCheck(DataFetchingTable);
