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
import { SurveyScreenValidationCriteria } from '~/types';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

interface VitalsTableProps {
  data: TableCells<PatientVitalsProps>;
  columns: string[];
}

const checkNeedsAttention = (
  value: string,
  validationCriteria: SurveyScreenValidationCriteria = {},
): boolean => {
  const { normalRange } = validationCriteria;
  const fValue = parseFloat(value);
  if (!normalRange || Number.isNaN(fValue)) return false;
  return fValue > normalRange.max || fValue < normalRange.min;
};

export const VitalsTable = memo(
  ({ data, columns }: VitalsTableProps): JSX.Element => {
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
        <StyledView
          borderBottomWidth={1}
          borderColor={theme.colors.BOX_OUTLINE}
          background={theme.colors.WHITE}
        >
          {/* Lines extending to end page underneath vitals entry so
        table doesn't cut off if only one or two vital rows */}
          {Array.from({ length: components.length + 1 })
            .fill(0)
            .map((_, i) => (
              <StyledView
                marginTop={3}
                position="absolute"
                borderBottomWidth={i ? 0 : 1}
                borderColor={theme.colors.BOX_OUTLINE}
                left={screenPercentageToDP(31.63, Orientation.Width)}
                top={screenPercentageToDP(6.46, Orientation.Height) * i}
                height={screenPercentageToDP(6.46, Orientation.Height)}
                zIndex={0}
                width="100%"
                background={i % 2 === 0 ? theme.colors.WHITE : theme.colors.BACKGROUND_GREY}
              />
            ))}
          <Table
            Title={VitalsTableTitle}
            tableHeader={vitalsTableHeader}
            rows={components.map(component => {
              const rowValidationCriteria = component.getValidationCriteriaObject();
              const config = component.getConfigObject();
              const { dataElement } = component;
              const { name, id } = dataElement;
              return {
                rowKey: 'dataElementId',
                rowTitle: id,
                rowHeader: i => <VitalsTableRowHeader title={name} isOdd={i % 2 === 0} />,
                cell: (cellData, i): JSX.Element => {
                  const value = cellData?.body || '';
                  const needsAttention = checkNeedsAttention(value, rowValidationCriteria);
                  if (needsAttention && !showNeedsAttentionInfo) setShowNeedsAttentionInfo(true);
                  return (
                    <VitalsTableCell
                      data={cellData}
                      config={config}
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
        </StyledView>
        {showNeedsAttentionInfo && (
          <StyledView background={theme.colors.BACKGROUND_GREY} padding={10}>
            <StyledText
              fontSize={screenPercentageToDP(1.57, Orientation.Height)}
              fontWeight={500}
              color={theme.colors.ALERT}
            >
              *Vital needs attention
            </StyledText>
          </StyledView>
        )}
      </StyledView>
    );
  },
);
