import React, { memo, useState } from 'react';
import { differenceInYears, differenceInMonths, differenceInWeeks, parseISO } from 'date-fns';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';
import { ReduxStoreProps } from '../../interfaces/ReduxStoreProps';
import { PatientStateProps } from '../../store/ducks/patient';
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
import { ValidationCriteriaNormalRange } from '../../../types/ISurvey';
import { useSelector } from 'react-redux';

interface VitalsTableProps {
  data: TableCells<PatientVitalsProps>;
  columns: string[];
}

/*
  Only applies to vitals survey components:
  Validation criteria normal range can be different by age but we also need
  to support the previous format where only one is specified.
  This will also be on desktop in file /app/utils/survey.js
  both should be changed together. Though note that the functions might not
  be exactly the same because of different APIs.
*/
const getNormalRangeByAge = (
  validationCriteria: any = {},
  { dateOfBirth },
): ValidationCriteriaNormalRange | undefined => {
  const { normalRange = {} } = validationCriteria;
  if (Array.isArray(normalRange) === false) {
    return normalRange;
  }

  const age = {
    years: differenceInYears(new Date(), parseISO(dateOfBirth)),
    months: differenceInMonths(new Date(), parseISO(dateOfBirth)),
    weeks: differenceInWeeks(new Date(), parseISO(dateOfBirth)),
  };

  const normalRangeByAge = normalRange.find(
    ({ ageUnit = '', ageMin = -Infinity, ageMax = Infinity }) => {
      if (['years', 'months', 'weeks'].includes(ageUnit) === false) return false;
      const ageInUnit = age[ageUnit];
      return ageInUnit >= ageMin && ageInUnit < ageMax;
    },
  );

  return normalRangeByAge;
};

const checkNeedsAttention = (
  value: string,
  validationCriteria: SurveyScreenValidationCriteria = {},
  patient: any,
): boolean => {
  const normalRange = getNormalRangeByAge(validationCriteria, patient);
  const fValue = parseFloat(value);
  if (!normalRange || Number.isNaN(fValue)) return false;
  return fValue > normalRange.max || fValue < normalRange.min;
};

export const VitalsTable = memo(
  ({ data, columns }: VitalsTableProps): JSX.Element => {
    const { selectedPatient } = useSelector(
      (state: ReduxStoreProps): PatientStateProps => state.patient,
    );
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
                  const needsAttention = checkNeedsAttention(value, rowValidationCriteria, selectedPatient);
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
