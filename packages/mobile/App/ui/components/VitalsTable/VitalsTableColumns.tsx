import React from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { Column } from '../Table';

export const vitalsTableCols: Column[] = [
  {
    id: 1,
    key: 'bloodPressure',
    title: 'Blood Pressure',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.bloodPressure}
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
    key: 'circumference',
    title: 'Circumference',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.circumference}
      </VitalsTableCell>
    ),
  },
  {
    id: 4,
    key: 'sp02',
    title: 'Sp02',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.sp02}
      </VitalsTableCell>
    ),
  },
  {
    id: 5,
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
    id: 6,
    key: 'fev',
    title: 'F.E.V',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>{row.fev}</VitalsTableCell>
    ),
  },
  {
    id: 7,
    key: 'cholesterol',
    title: 'Cholesterol',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.cholesterol}
      </VitalsTableCell>
    ),
  },
  {
    id: 8,
    key: 'bloodGlucose',
    title: 'Blood Glucose',
    rowHeader: (column: any): JSX.Element => (
      <VitalsTableRowHeader key={column.title} col={column} />
    ),
    accessor: (row: PatientVitalsProps, _, column): JSX.Element => (
      <VitalsTableCell key={`${row.id}${column.id}`}>
        {row.bloodGlucose}
      </VitalsTableCell>
    ),
  },
];
