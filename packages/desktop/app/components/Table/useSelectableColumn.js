import React, { useState, useCallback, useMemo } from 'react';
import { CheckInput } from '../Field';

export const useSelectableColumn = (rows, { columnKey = 'selected', selectionKey = 'id' } = {}) => {
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
    ({ rowIndex }) => (
      <CheckInput
        value={selectedKeys.has(rows[rowIndex][selectionKey])}
        name="selected"
        onChange={event => cellOnChange(event, rowIndex)}
        style={{ margin: 'auto' }}
      />
    ),
    [rows, selectionKey, selectedKeys, cellOnChange],
  );

  const titleOnChange = useCallback(
    event => {
      const newSelection = event.target.checked ? rows.map(row => row[selectionKey]) : [];
      setSelectedKeys(new Set(newSelection));
    },
    [rows, selectionKey],
  );
  const titleAccessor = useCallback(() => {
    const isEveryRowSelected = rows?.length > 0 && selectedRows.length === rows.length;
    return (
      <CheckInput
        value={isEveryRowSelected}
        name="selected"
        onChange={titleOnChange}
        style={{ margin: 'auto' }}
      />
    );
  }, [rows, selectedRows, titleOnChange]);

  return {
    selectedRows,
    selectableColumn: {
      key: columnKey,
      title: '',
      sortable: false,
      titleAccessor,
      accessor: cellAccessor,
    },
  };
};
