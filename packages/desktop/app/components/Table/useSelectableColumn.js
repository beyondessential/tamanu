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
      if (event.target.checked) {
        setSelectedKeys(new Set([...selectedKeys, rowKey]));
      } else {
        setSelectedKeys(new Set([...selectedKeys].filter(k => k !== rowKey)));
      }
    },
    [rows, selectionKey, selectedKeys],
  );
  const cellAccessor = useCallback(
    ({ rowIndex }) => (
      <CheckInput
        value={selectedKeys.has(rows[rowIndex][selectionKey])}
        name="selected"
        onChange={event => cellOnChange(event, rowIndex)}
      />
    ),
    [rows, selectionKey, selectedKeys, cellOnChange],
  );

  const titleOnChange = useCallback(
    event => {
      if (event.target.checked) {
        setSelectedKeys(new Set(rows.map(row => row[selectionKey])));
      } else {
        setSelectedKeys(new Set([]));
      }
    },
    [rows, selectionKey],
  );
  const titleAccessor = useCallback(() => {
    const isEveryRowSelected = rows?.length > 0 && selectedRows.length === rows.length;
    return <CheckInput value={isEveryRowSelected} name="selected" onChange={titleOnChange} />;
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
