import React, { memo } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsTableCols } from './VitalsTableData';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';

interface VitalsTableProps {
  patientData: PatientVitalsProps[];
}

export const VitalsTable = memo(
  ({ patientData }: VitalsTableProps): JSX.Element => (
    <Table
      Title={VitalsTableTitle}
      tableHeader={vitalsTableHeader}
      onPressItem={(): null => null}
      rows={rows}
      columns={vitalsTableCols}
      cells={cells}

      // columns={vitalsTableCols}
      // data={patientData}
      // columnKey="date"
    />
  ),
);
