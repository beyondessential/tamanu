import React, { memo } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table, TableCells } from '../Table';
import { vitalsTableRows } from './VitalsTableRows';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { LoadingScreen } from '/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';
import { VitalsDataElements } from '/helpers/constants';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

interface VitalsTableProps {
  data: TableCells<PatientVitalsProps>;
  columns: string[];
}

export const VitalsTable = memo(({ data, columns }: VitalsTableProps) : JSX.Element => {
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
    <>
      <Table
        Title={VitalsTableTitle}
        tableHeader={vitalsTableHeader}
        rows={vitalsTableRows(rows)}
        columns={columns}
        cells={data}
      />
      <StyledView padding={10}>
        <StyledText color={theme.colors.ALERT}>*Vital needs attention</StyledText>
      </StyledView>
    </>
  );
});
