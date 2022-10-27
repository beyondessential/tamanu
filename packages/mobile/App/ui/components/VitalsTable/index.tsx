import React, { memo, useCallback } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsRows, vitalsColumns } from './VitalsTableData';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';
interface VitalsTableProps {
  patientData: PatientVitalsProps[];
}

export const VitalsTable = memo(
  ({ patientData }: VitalsTableProps): JSX.Element => {
    const columns = useCallback(() => vitalsColumns(patientData), [patientData])();
    const cells = {};
    patientData.forEach(vitals => {
      const recordedDateString = formatStringDate(vitals.dateRecorded, DateFormats.DATE_AND_TIME);
      cells[recordedDateString] = [];
      Object.entries(vitals).forEach(([key, value]) => {
        cells[recordedDateString].push({
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
