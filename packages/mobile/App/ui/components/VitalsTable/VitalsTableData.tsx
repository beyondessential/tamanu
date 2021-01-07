import React from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';

// const rowHeader = (column: any): JSX.Element => (
//   <VitalsTableRowHeader key={column.key} col={column} />
// );

const accessor = (row: PatientVitalsProps, _, column): JSX.Element => (
  <VitalsTableCell key={column.key}>{row[column.key]}</VitalsTableCell>
);


export const vitalsRows = [
  {
    rowTitle: 1,
    rowKey: 1,
    rowHeader: <VitalsTableRowHeader title={rowTitle} />,
  },
];

export const vitalsColumns: string[] = [
  'Weight (kg)',
  'Height (cm)',
  'sbp',
  'dbp',
  'Heart Rate',
  'Respiratory Rate',
  'Temperature (ºC)',
  'SvO2 (%)',
  'AVPU',
];

export const vitalsCells = [];