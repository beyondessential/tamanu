import React from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { Column } from '../Table';

const rowHeader = (column: any): JSX.Element => (
  <VitalsTableRowHeader key={column.key} col={column} />
);

const accessor = (row: PatientVitalsProps, _, column): JSX.Element => (
  <VitalsTableCell key={column.key}>{row[column.key]}</VitalsTableCell>
);

export const vitalsTableCols: Column[] = [
  {
    id: 2,
    key: 'weight',
    title: 'Weight (kg)',
    rowHeader,
    accessor,
  },
  {
    id: 3,
    key: 'height',
    title: 'Height (cm)',
    rowHeader,
    accessor,
  },
  {
    id: 4,
    key: 'sbp',
    title: 'sbp',
    rowHeader,
    accessor,
  },
  {
    id: 5,
    key: 'dbp',
    title: 'dbp',
    rowHeader,
    accessor,
  },
  {
    id: 6,
    key: 'heartRate',
    title: 'Heart Rate',
    rowHeader,
    accessor,
  },
  {
    id: 7,
    key: 'respiratoryRate',
    title: 'Respiratory Rate',
    rowHeader,
    accessor,
  },
  {
    id: 8,
    key: 'temperature',
    title: 'Temperature (ºC)',
    rowHeader,
    accessor,
  },
  {
    id: 9,
    key: 'svO2',
    title: 'SvO2 (%)',
    rowHeader,
    accessor,
  },
  {
    id: 10,
    key: 'avpu',
    title: 'AVPU',
    rowHeader,
    accessor,
  },
];
