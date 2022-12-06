import React, { memo } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table } from '../Table';
import { vitalsTableRows } from './VitalsTableRows';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { LoadingScreen } from '/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';

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

  return (
    <Table
      Title={VitalsTableTitle}
      tableHeader={vitalsTableHeader}
      rows={vitalsTableRows(vitalsSurvey.components)}
      columns={columns}
      cells={data}
    />
  );
});
