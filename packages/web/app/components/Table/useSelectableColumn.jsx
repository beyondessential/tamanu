import React, { useCallback, useMemo, useState } from 'react';
import { CheckInput } from '../Field';

export const useSelectableColumn = (
  rows,
  {
    columnKey = 'selected',
    selectionKey = 'id',
    getIsRowDisabled = () => false,
    getIsTitleDisabled = () => false,
    showIndeterminate = false,
  } = {},
) => {
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const selectedRows = useMemo(() => {
    if (!rows) {
      return [];
    }
    return rows.filter(row => selectedKeys.has(row[selectionKey]));
  }, [rows, selectedKeys, selectionKey]);

  const cellOnChange = useCallback(
    (event, rowIndex) => {
      const rowKey = rows[rowIndex][selectionKey];
      const newSelection = event.target.checked
        ? [...selectedKeys, rowKey]
        : [...selectedKeys].filter(k => k !== rowKey);
      setSelectedKeys(new Set(newSelection));
    },
    [rows, selectionKey, selectedKeys],
  );
  const cellAccessor = useCallback(
    row => {
      const { rowIndex } = row;
      return (
        <CheckInput
          value={selectedKeys.has(rows[rowIndex][selectionKey])}
          name="selected"
          onChange={event => cellOnChange(event, rowIndex)}
          style={{ margin: 'auto' }}
          disabled={getIsRowDisabled(selectedKeys, row)}
        />
      );
    },
    [rows, selectionKey, selectedKeys, cellOnChange],
  );

  const titleOnChange = useCallback(
    event => {
      let newSelection;
      const mappedSelectedKeys = [...selectedKeys, ...rows.map(row => row[selectionKey])];
      const filteredSelectedKeys = [...selectedKeys].filter(
        k => !rows.some(row => row[selectionKey] === k),
      );

      if (!showIndeterminate) {
        newSelection = event.target.checked ? mappedSelectedKeys : filteredSelectedKeys;
      } else {
        newSelection = !selectedKeys.size ? mappedSelectedKeys : filteredSelectedKeys;
      }

      setSelectedKeys(new Set(newSelection));
    },
    [rows, selectionKey, selectedKeys],
  );

  const titleAccessor = useCallback(() => {
    const isEveryRowSelected =
      rows?.length > 0 && rows.every(r => selectedKeys.has(r[selectionKey]));

    const isSomeRowSelected =
      rows?.length > 0 &&
      rows.some(r => selectedKeys.has(r[selectionKey])) &&
      !rows.every(r => selectedKeys.has(r[selectionKey]));

    return (
      <CheckInput
        value={isEveryRowSelected}
        name="selected"
        onChange={titleOnChange}
        style={{ margin: 'auto' }}
        indeterminate={showIndeterminate && isSomeRowSelected}
        disabled={getIsTitleDisabled(selectedKeys)}
      />
    );
  }, [rows, selectedRows, titleOnChange]);

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
