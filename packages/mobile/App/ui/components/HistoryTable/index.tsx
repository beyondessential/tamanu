import React from 'react';
import { DataTable } from 'react-native-paper';
import MultilineCell from './MultilineCell';

// TODO: define more restrictive types for data and rows

/**
 * @param data Object
 * @param rows Object where each key matches a key in data to render,
 *             and each value has a name and optional accessor function.
 */
export const HistoryTable = ({ data, rows }: { data: object; rows: object }): JSX.Element => (
  <DataTable style={{ paddingHorizontal: 10 }}>
    {Object.entries(rows).map(([key, row]): JSX.Element => {
      const cellValue = row.accessor
        ? row.accessor(data[key])
        : ((data[key] === null || data[key] === undefined) || '');
      return (
        <DataTable.Row>
          <MultilineCell>{row.name}</MultilineCell>
          <MultilineCell>{cellValue}</MultilineCell>
        </DataTable.Row>
      );
    })}
  </DataTable>
);
