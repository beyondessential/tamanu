import React from 'react';
import { DataTable } from 'react-native-paper';

/**
 * @param data Object
 * @param rows Object where each key matches a key in data to render,
 *             and each value has a name and optional accessor function.
 */
export const HistoryTable = ({ data, rows }: { data: object; rows: object}): JSX.Element => (
  <DataTable style={{ paddingHorizontal: 10 }}>
    {Object.entries(rows).map(([key, row]): JSX.Element => {
      const cellValue = row.accessor
        ? row.accessor(data[key])
        : ((data[key] === null || data[key] === undefined) || '');
      return (
        <DataTable.Row>
          <DataTable.Cell>{row.name}</DataTable.Cell>
          <DataTable.Cell>{cellValue}</DataTable.Cell>
        </DataTable.Row>
      );
    })}
  </DataTable>
);
