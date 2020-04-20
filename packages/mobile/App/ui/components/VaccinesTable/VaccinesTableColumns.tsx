import React, { ReactElement } from 'react';
import { VaccineTableCell } from './VaccinesTableCell';
import { VaccineRowHeader } from './VaccineRowHeader';
import { Column } from '../Table';

export const vaccineTableCols: Column[] = [
  {
    key: 'bcg',
    title: 'BCG',
    subtitle: '(Tuberculosis)',
    rowHeader: (column: any): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        header={row.header}
        key={column.key}
        vaccine={row[column.key]}
      />
    ),
  },
  {
    key: 'hepb',
    title: 'HepB',
    subtitle: '(Hepatitis B)',
    rowHeader: (column: Column): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        header={row.header}
        vaccine={row[column.key]}
      />
    ),
  },
  {
    key: 'dpt',
    title: 'DPT-HepB-Hib',
    subtitle: '(Pentavalent)',
    rowHeader: (column: Column): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        header={row.header}
        vaccine={row[column.key]}
      />
    ),
  },
  {
    key: 'pcv',
    title: 'PCV',
    subtitle: '(Pneumococcal)',
    rowHeader: (column): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        header={row.header}
        vaccine={row[column.key]}
      />
    ),
  },
  {
    key: 'ipv',
    title: 'IPV',
    subtitle: '(Inactivated poliovirus)',
    rowHeader: (column): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        header={row.header}
        vaccine={row[column.key]}
      />
    ),
  },
  {
    key: 'mr',
    title: 'MR',
    subtitle: '(Measles-rubella)',
    rowHeader: (column): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        header={row.header}
        vaccine={row[column.key]}
      />
    ),
  },
  {
    key: 'tt',
    title: 'TT',
    subtitle: '(Tetanus)',
    rowHeader: (column): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        header={row.header}
        vaccine={row[column.key]}
      />
    ),
  },
];
