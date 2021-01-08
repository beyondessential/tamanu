import React, { ReactElement } from 'react';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { Row } from '../Table';

export const vitalsColumns = (patientData): string[] => patientData.map(d => d.date.toDateString());

export const vitalRowFieldsToNames = {
  weight: 'Weight (kg)',
  height: 'Height (cm)',
  sbp: 'sbp',
  dbp: 'dbp',
  heartRate: 'Heart Rate',
  respiratoryRate: 'Respiratory Rate',
  temperature: 'Temperature (ºC)',
  svO2: 'SvO2 (%)',
  avpu: 'AVPU',
};

export const vitalsRows: Row[] = [
  'weight',
  'height',
  'sbp',
  'dbp',
  'heartRate',
  'respiratoryRate',
  'temperature',
  'svO2',
  'avpu',
].map(r => ({
  rowKey: 'label',
  rowTitle: r,
  rowHeader: (): ReactElement => (
    <VitalsTableRowHeader title={r} />
  ),
  cell: (cellData): ReactElement => (
    <VitalsTableCell data={cellData} />
  ),
}));
