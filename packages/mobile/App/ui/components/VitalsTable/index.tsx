import React, { memo, useState } from 'react';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { Table, TableCells } from '../Table';
import { vitalsTableHeader } from './VitalsTableHeader';
import { VitalsTableTitle } from './VitalsTableTitle';
import { LoadingScreen } from '/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';
import { VitalsDataElements } from '/helpers/constants';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { VitalsTableRowHeader } from './VitalsTableRowHeader';
import { VitalsTableCell } from './VitalsTableCell';
import { ValidationCriteria } from '~/types';

interface VitalsTableProps {
  data: TableCells<PatientVitalsProps>;
  columns: string[];
}

const checkNeedsAttention = (
  value: string,
  validationCriteria: ValidationCriteria = {},
): boolean => {
  const { normalRange } = validationCriteria;
  const fValue = parseFloat(value);
  if (!normalRange || Number.isNaN(fValue)) return false;
  return fValue > normalRange.max || fValue < normalRange.min;
};

export const VitalsTable = memo(({ data, columns }: VitalsTableProps): JSX.Element => {
  const [vitalsSurvey, error] = useBackendEffect(({ models }) => models.Survey.getVitalsSurvey());
  const [showNeedsAttentionInfo, setShowNeedsAttentionInfo] = useState(false);

  if (!vitalsSurvey) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Date is the column so remove it from rows
  const components = vitalsSurvey.components.filter(
    c => c.dataElementId !== VitalsDataElements.dateRecorded,
  );

  return (
    <StyledView height="100%" background={theme.colors.BACKGROUND_GREY}>
      <Table
        Title={VitalsTableTitle}
        tableHeader={vitalsTableHeader}
        rows={components.map(component => {
          const rowValidationCriteria = component.getValidationCriteriaObject();
          const { dataElement } = component;
          const { name, id } = dataElement;
          return {
            rowKey: 'dataElementId',
            rowTitle: id,
            rowHeader: (i) => (
              <VitalsTableRowHeader
                title={name}
                isOdd={i % 2 === 0}
              />
            ),
            cell: (cellData, i): JSX.Element => {
              const needsAttention = checkNeedsAttention(cellData?.body || '', rowValidationCriteria);
              if (needsAttention && !showNeedsAttentionInfo) setShowNeedsAttentionInfo(true);
              return (
                <VitalsTableCell
                  data={cellData}
                  key={cellData?.id || id}
                  needsAttention={needsAttention}
                  isOdd={i % 2 === 0}
                />
              );
            },
          };
        })}
        columns={columns}
        cells={data}
      />
      {showNeedsAttentionInfo && (
        <StyledView padding={10}>
          <StyledText
            fontWeight={500}
            color={theme.colors.ALERT}>*Vital needs attention
          </StyledText>
        </StyledView>
      )}
    </StyledView>
  );
});
