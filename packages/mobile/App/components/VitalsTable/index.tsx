import React, { memo } from 'react';
import { Table } from '../Table';
import { vitalsTableCols } from './VitalsTableColumns';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';

interface VitalsTableProps {
  patientData: PatientVitalsProps[];
}

export const VitalsTable = memo(
  ({ patientData }: VitalsTableProps): JSX.Element => (
    <Table
      columns={vitalsTableCols}
      Title={VitalsTableTitle}
      data={patientData}
      tableHeader={vitalsTableHeader}
      columnKey="date"
    />
  ),
);
