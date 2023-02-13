import React, { memo } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsTableRows } from './VitalsTableRows';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { LoadingScreen } from '/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';
import { VitalsDataElements } from '/helpers/constants';

interface VitalsTableProps {
  data: PatientVitalsProps[];
  columns: [];
}

export const VitalsTable: React.FC<VitalsTableProps> = memo(({ data, columns }) => {
  const [vitalsSurvey, error] = useBackendEffect(({ models }) => models.Survey.getVitalsSurvey());

  if (!vitalsSurvey) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Date is the column so remove it from rows
  const rows = vitalsSurvey.components.filter(
    c => c.dataElementId !== VitalsDataElements.dateRecorded,
  );

  return (
    <Table
      Title={VitalsTableTitle}
      tableHeader={vitalsTableHeader}
      rows={vitalsTableRows(rows)}
      columns={columns}
      cells={data}
    />
  );
});
