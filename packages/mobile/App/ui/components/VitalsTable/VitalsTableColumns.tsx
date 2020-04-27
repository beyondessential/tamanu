import React from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { Column } from '../Table';

export const vitalsTableCols: Column[] = [
  {
    id: 1,
    key: 'height',
    title: 'Height',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.height}
      </VitalsTableCell>
    ),
  },
  {
    id: 2,
    key: 'weight',
    title: 'Weight',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.weight}
      </VitalsTableCell>
    ),
  },
  {
    id: 3,
    key: 'temperature',
    title: 'Temperature',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.temperature}
      </VitalsTableCell>
    ),
  },
  {
    id: 4,
    key: 'sbp',
    title: 'SBP',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>{row.sbp}</VitalsTableCell>
    ),
  },
  {
    id: 5,
    key: 'dbp',
    title: 'DBP',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>{row.dbp}</VitalsTableCell>
    ),
  },
  {
    id: 6,
    key: 'heartRate',
    title: 'Heart Rate',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.heartRate}
      </VitalsTableCell>
    ),
  },
  {
    id: 7,
    key: 'respiratoryRate',
    title: 'Respiratory rate',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.respiratoryRate}
      </VitalsTableCell>
    ),
  },
  {
    id: 8,
    key: 'sv02',
    title: 'Sv02',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.sv02}
      </VitalsTableCell>
    ),
  },

  {
    id: 9,
    key: 'avpu',
    title: 'AVPU',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.avpu}
      </VitalsTableCell>
    ),
  },
];
