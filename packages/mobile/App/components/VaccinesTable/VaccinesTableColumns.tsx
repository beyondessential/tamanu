import React from 'react';
import { VaccineTableCell } from './VaccinesTableCell';
import { VaccineRowHeader } from './VaccineRowHeader';
import { Column } from '../Table';

export const vaccineTableCols = [
  {
    key: 'bcg',
    title: 'BCG',
    subtitle: '(Tuberculosis)',
    rowHeader: (column: any): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.bcg} />
    ),
  },
  {
    key: 'hepb',
    title: 'HepB',
    subtitle: '(Hepatitis B)',
    rowHeader: (column: Column): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.hepb} />
    ),
  },
  {
    key: 'dpt',
    title: 'DPT-HepB-Hib',
    subtitle: '(Pentavalent)',
    rowHeader: (column: Column): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.dpt} />
    ),
  },
  {
    key: 'pcv',
    title: 'PCV',
    subtitle: '(Pneumococcal)',
    rowHeader: (column: any): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.pcv} />
    ),
  },
  {
    key: 'ipv',
    title: 'IPV',
    subtitle: '(Inactivated poliovirus)',
    rowHeader: (column: any): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.ipv} />
    ),
  },
  {
    key: 'mr',
    title: 'MR',
    subtitle: '(Measles-rubella)',
    rowHeader: (column: any): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.mr} />
    ),
  },
  {
    key: 'tt',
    title: 'TT',
    subtitle: '(Tetanus)',
    rowHeader: (column: any): JSX.Element => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, column: Column): JSX.Element => (
      <VaccineTableCell key={column.key} vaccineType={row.tt} />
    ),
  },
];
