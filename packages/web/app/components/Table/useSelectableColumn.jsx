import React, { useCallback, useMemo, useState } from 'react';
import IndeterminateCheckBoxOutlinedIcon from '@material-ui/icons/IndeterminateCheckBoxOutlined';
import styled from 'styled-components';
import { CheckInput } from '../Field';
import { Colors } from '../../constants';

const IconButton = styled.div`
  cursor: pointer;
`;

export const useSelectableColumn = (
  rows,
  { columnKey = 'selected', selectionKey = 'id', bulkDeselectOnly = false } = {},
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
    if (bulkDeselectOnly && selectedRows.length > 0) {
      return (
        <IconButton onClick={titleOnChange}>
          <IndeterminateCheckBoxOutlinedIcon style={{ color: Colors.primary, fontSize: '20px' }} />
        </IconButton>
      );
    }

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
