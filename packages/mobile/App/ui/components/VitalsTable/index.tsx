import React, { memo, useCallback } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsRows, vitalsColumns } from './VitalsTableData';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';

interface VitalsTableProps {
  patientData: PatientVitalsProps[];
}

export const VitalsTable = memo(
  ({ patientData }: VitalsTableProps): JSX.Element => {
    const columns = useCallback(() => vitalsColumns(patientData), [patientData])();
    const cells = {};
    patientData.forEach(vitals => {
      cells[vitals.date.toDateString()] = [];
      Object.entries(vitals).forEach(([key, value]) => {
        cells[vitals.date.toDateString()].push({
          label: key,
          value,
        });
      });
    });

    return (
      <Table
        Title={VitalsTableTitle}
        tableHeader={vitalsTableHeader}
        rows={vitalsRows}
        columns={columns}
        cells={cells}
      />
    );
  },
);
