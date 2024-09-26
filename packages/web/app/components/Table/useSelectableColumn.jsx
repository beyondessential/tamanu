import React, { useCallback, useMemo, useState } from 'react';
import IndeterminateCheckBoxOutlinedIcon from '@material-ui/icons/IndeterminateCheckBoxOutlined';
import styled from 'styled-components';
import { CheckInput } from '../Field';
import { Colors } from '../../constants';
import { uniqBy } from 'lodash';

const IconButton = styled.div`
  cursor: pointer;
`;

export const useSelectableColumn = (
  rows,
  { columnKey = 'selected', selectionKey = 'id', bulkDeselectOnly = false } = {},
) => {
  const [selectedRows, setSelectedRows] = useState([]);

  const isSelected = row => !!selectedRows.some(sr => sr[selectionKey] === row[selectionKey]);

  const currentSelectedRows = useMemo(() => {
    if (bulkDeselectOnly) return selectedRows;
    if (!rows) {
      return [];
    }
    return rows.filter(isSelected);
  }, [rows, selectedRows, selectionKey]);

  const cellOnChange = useCallback(
    (event, rowIndex) => {
      const row = rows[rowIndex];
      const newSelection = event.target.checked
        ? [...selectedRows, row]
        : [...selectedRows].filter(sr => sr[selectionKey] !== row[selectionKey]);
      setSelectedRows(newSelection);
    },
    [rows, selectionKey, selectedRows],
  );
  const cellAccessor = useCallback(
    ({ rowIndex }) => (
      <CheckInput
        value={isSelected(rows[rowIndex])}
        name="selected"
        onChange={event => cellOnChange(event, rowIndex)}
        style={{ margin: 'auto' }}
      />
    ),
    [rows, selectionKey, selectedRows, cellOnChange],
  );

  const titleOnChange = useCallback(
    event => {
      let newSelection = event.target.checked ? rows : [];
      if (bulkDeselectOnly) {
        newSelection = event.target.checked
          ? uniqBy([...newSelection, ...selectedRows], selectionKey)
          : selectedRows.filter(sr => !rows.some(r => r[selectionKey] === sr[selectionKey]));
      }
      setSelectedRows(newSelection);
    },
    [rows, selectionKey],
  );

  const selectAll = () => {
    let newSelection = rows;
    if (bulkDeselectOnly) {
      newSelection = uniqBy([...newSelection, ...selectedRows], selectionKey);
    }
    setSelectedRows(newSelection);
  };

  const titleAccessor = useCallback(() => {
    const isEveryRowSelected = rows?.length > 0 && rows.every(isSelected);
    const isSomeRowSelected = rows?.length > 0 && rows.some(isSelected);

    if (bulkDeselectOnly && selectedRows.length > 0 && !isEveryRowSelected && isSomeRowSelected) {
      return (
        <IconButton onClick={selectAll}>
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
    selectedRows: currentSelectedRows,
    selectableColumn: {
      key: columnKey,
      title: '',
      sortable: false,
      titleAccessor,
      accessor: cellAccessor,
    },
  };
};
