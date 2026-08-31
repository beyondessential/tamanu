import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckInput } from '../Field';

export const useSelectableColumn = (
  rows,
  {
    columnKey = 'selected',
    selectionKey = 'id',
    getIsRowDisabled = () => false,
    getIsTitleDisabled = () => false,
    showIndeterminate = false,
    getRowsFilterer = () => () => true,
    selectAllOnInit = false,
    // Optional predicate to pre-select a subset of rows once, when they first load (e.g. rows
    // whose sample has been recorded). Applied a single time so it never overrides later toggles.
    getIsRowInitiallySelected = null,
  } = {},
) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const selectedRows = useMemo(() => {
    if (!rows) {
      return [];
    }
    return rows.filter((row) => selectedKeys.has(row[selectionKey]));
  }, [rows, selectedKeys, selectionKey]);

  useEffect(() => {
    if (selectAllOnInit && rows?.length > 0) {
      const allKeys = new Set(rows.map(row => row[selectionKey]));
      setSelectedKeys(allKeys);
    }
  }, [rows, selectAllOnInit, selectionKey]);

  const hasAppliedInitialSelection = useRef(false);
  useEffect(() => {
    if (hasAppliedInitialSelection.current || !getIsRowInitiallySelected || !rows?.length) return;
    hasAppliedInitialSelection.current = true;
    setSelectedKeys(
      new Set(rows.filter(getIsRowInitiallySelected).map(row => row[selectionKey])),
    );
  }, [rows, getIsRowInitiallySelected, selectionKey]);

  const cellOnChange = useCallback(
    (event, rowIndex) => {
      const rowKey = rows[rowIndex][selectionKey];
      const newSelection = event.target.checked
        ? [...selectedKeys, rowKey]
        : [...selectedKeys].filter((k) => k !== rowKey);
      setSelectedKeys(new Set(newSelection));
    },
    [rows, selectionKey, selectedKeys],
  );
  const cellAccessor = useCallback(
    (row) => {
      const { rowIndex } = row;
      return (
        <CheckInput
          value={selectedKeys.has(rows[rowIndex][selectionKey])}
          name="selected"
          onChange={(event) => cellOnChange(event, rowIndex)}
          style={{ margin: 'auto' }}
          disabled={getIsRowDisabled(selectedKeys, row)}
          data-testid="checkinput-83pj"
        />
      );
    },
    [rows, selectionKey, selectedKeys, cellOnChange],
  );

  const titleOnChange = useCallback(
    (event) => {
      const newSelection = event.target.checked
        ? [
            ...selectedKeys,
            ...rows.filter(getRowsFilterer(selectedKeys)).map((row) => row[selectionKey]),
          ]
        : [...selectedKeys].filter((k) => !rows.some((row) => row[selectionKey] === k));
      setSelectedKeys(new Set(newSelection));
    },
    [rows, selectionKey, selectedKeys],
  );

  const titleAccessor = useCallback(() => {
    const isEveryRowSelected =
      rows?.length > 0 &&
      rows.filter(getRowsFilterer(selectedKeys)).every((r) => selectedKeys.has(r[selectionKey]));

    const isSomeRowSelected =
      rows?.length > 0 &&
      rows.some((r) => selectedKeys.has(r[selectionKey])) &&
      !isEveryRowSelected;

    return (
      <CheckInput
        value={isEveryRowSelected}
        name="selected"
        onChange={titleOnChange}
        style={{ margin: 'auto' }}
        indeterminate={showIndeterminate && isSomeRowSelected}
        disabled={getIsTitleDisabled(selectedKeys)}
        data-testid="checkinput-irky"
      />
    );
  }, [rows, selectedRows, titleOnChange, selectedKeys]);

  const resetSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  return {
    selectedRows,
    selectableColumn: {
      key: columnKey,
      title: '',
      sortable: false,
      titleAccessor,
      accessor: cellAccessor,
    },
    resetSelection,
  };
};
