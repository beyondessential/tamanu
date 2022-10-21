import React, { ReactElement } from 'react';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { Row } from '../Table';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';

export const vitalsColumns = (patientData): string[] =>
  patientData.map(d => formatStringDate(d.dateRecorded, DateFormats.DATE_AND_TIME));

export const vitalRowFieldsToNames = {
  weight: 'Weight (kg)',
  height: 'Height (cm)',
  sbp: 'sbp',
  dbp: 'dbp',
  heartRate: 'Heart Rate',
  respiratoryRate: 'Respiratory Rate',
  temperature: 'Temperature (ºC)',
  spO2: 'SpO2 (%)',
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
  'spO2',
  'avpu',
].map(r => ({
  rowKey: 'label',
  rowTitle: r,
  rowHeader: (): ReactElement => <VitalsTableRowHeader title={r} />,
  cell: (cellData): ReactElement => (
    <VitalsTableCell rowKey={r} data={cellData} key={cellData.id} />
  ),
}));
