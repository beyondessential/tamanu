import React from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { Column } from '../Table';

export const vitalsTableCols: Column[] = [
  {
    id: 2,
    key: 'weight',
    title: 'Weight (kg)',
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
    key: 'height',
    title: 'Height (cm)',
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
    id: 4,
    key: 'sbp',
    title: 'sbp',
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
    title: 'dbp',
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
    title: 'Respiratory Rate',
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
    key: 'temperature',
    title: 'Temperature (ºC)',
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
    id: 9,
    key: 'svO2',
    title: 'SvO2 (%)',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.svO2}
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
