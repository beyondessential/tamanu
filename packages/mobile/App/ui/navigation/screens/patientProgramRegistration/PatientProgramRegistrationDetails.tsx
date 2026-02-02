import React from 'react';
import { sortBy, groupBy } from 'lodash';
import styled from 'styled-components';
import { PROGRAM_REGISTRY_CONDITION_CATEGORIES } from '~/constants/programRegistries';
import {
  TranslatedReferenceData,
  getReferenceDataStringId,
} from '~/ui/components/Translations/TranslatedReferenceData';
import { TranslatedText, TranslatedTextElement } from '~/ui/components/Translations/TranslatedText';

import { useBackendEffect } from '~/ui/hooks';
import { StyledScrollView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

const Row = styled(StyledView)`
  margin-left: 20px;
  padding-top: 20px;
  padding-bottom: 20px;
  flex-direction: row;
  justify-content: flex-start;
  border-bottom-width: 1px;
  border-color: ${theme.colors.BOX_OUTLINE};
`;

const RowLabelContainer = styled(StyledView)`
  width: 32%;
`;

const RowValueContainer = styled(StyledView)`
  width: 68%;
`;

const RowLabel = styled(StyledText)`
  font-size: 14px;
  color: ${theme.colors.TEXT_MID};
  font-weight: 400;
`;

const RowValue = styled(StyledText)`
  margin-left: 10;
  font-size: 14px;
  color: ${theme.colors.TEXT_SUPER_DARK};
  font-weight: 500;
`;

const DataRow = ({
  label,
  value,
}: {
  label: TranslatedTextElement;
  value: TranslatedTextElement;
}) => {
  return (
    <Row>
      <RowLabelContainer>
        <RowLabel>{label}</RowLabel>
      </RowLabelContainer>
      <RowValueContainer>
        <RowValue>{value}</RowValue>
      </RowValueContainer>
    </Row>
  );
};

const HorizontalLine = ({ marginTop = 0, marginBottom = 0 }) => (
  <StyledView
    borderColor={theme.colors.BOX_OUTLINE}
    borderBottomWidth={1}
    marginTop={marginTop}
    marginBottom={marginBottom}
  />
);

const TranslatedCondition = ({ condition }) => (
  <RowValue marginBottom={10}>
    <TranslatedReferenceData
      fallback={condition.programRegistryCondition.name}
      value={condition.programRegistryCondition.id}
      category="programRegistryCondition"
    />
    {` `}(
    <TranslatedReferenceData
      fallback={condition.programRegistryConditionCategory.name}
      value={condition.programRegistryConditionCategory.id}
      category="programRegistryConditionCategory"
    />
    )
  </RowValue>
);

const PatientProgramRegistrationConditionsDetailsRow = ({ conditions }) => {
  const { getTranslation } = useTranslation();

  const initConditions = Array.isArray(conditions) ? conditions : [];
  // We hide recorded in error conditions
  const filteredConditions = initConditions.filter(
    ({ programRegistryConditionCategory }) =>
      programRegistryConditionCategory.code !== PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
  );

  // Sort alphabetically by condition name
  const sortedConditions = sortBy(filteredConditions, ({ programRegistryCondition }) => {
    const stringId = getReferenceDataStringId(
      programRegistryCondition.id,
      'programRegistryCondition',
    );
    return getTranslation(stringId, programRegistryCondition.name);
  });

  const groupedConditions = groupBy(sortedConditions, ({ programRegistryConditionCategory }) =>
    [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
    ].includes(programRegistryConditionCategory.code)
      ? 'closed'
      : 'open',
  );
  const needsDivider = groupedConditions.closed && groupedConditions.open;

  return (
    <Row>
      <RowLabelContainer>
        <RowLabel>
          <TranslatedText stringId="programRegistry.conditions.label" fallback="Conditions" />
        </RowLabel>
      </RowLabelContainer>
      <RowValueContainer>
        {initConditions.length === 0 && <RowValue>—</RowValue>}
        {groupedConditions.open &&
          groupedConditions.open.map((condition, i) => (
            <TranslatedCondition key={`open-condition-${i}`} condition={condition} />
          ))}
        {needsDivider && <HorizontalLine marginBottom={10} />}
        {groupedConditions.closed &&
          groupedConditions.closed.map((condition, i) => (
            <TranslatedCondition key={`closed-condition-${i}`} condition={condition} />
          ))}
      </RowValueContainer>
    </Row>
  );
};

export const PatientProgramRegistrationDetails = ({ route }) => {
  const { patientProgramRegistration } = route.params;
  const { formatShort } = useDateTimeFormat();
  const [pprCondition] = useBackendEffect(
    async ({ models }) =>
      models.PatientProgramRegistrationCondition.findForRegistration(patientProgramRegistration.id),
    [patientProgramRegistration],
  );
  return (
    <StyledScrollView background={theme.colors.WHITE}>
      <HorizontalLine />
      <DataRow
        label={
          <TranslatedText
            stringId="programRegistry.registrationDate.label"
            fallback="Date of registration"
          />
        }
        value={formatShort(patientProgramRegistration.date) || '—'}
      />
      <DataRow
        label={
          <TranslatedText stringId="programRegistry.registeredBy.label" fallback="Registered by" />
        }
        value={patientProgramRegistration?.clinician?.displayName}
      />
      <DataRow
        label={
          <TranslatedText
            stringId="programRegistry.registeringFacility.label"
            fallback="Registering facility"
          />
        }
        value={
          <TranslatedReferenceData
            fallback={patientProgramRegistration.registeringFacility?.name}
            value={patientProgramRegistration.registeringFacility?.id}
            category="facility"
          />
        }
      />
      <DataRow
        label={<TranslatedText stringId="programRegistry.clinicalStatus.label" fallback="Status" />}
        value={
          <TranslatedReferenceData
            fallback={patientProgramRegistration.clinicalStatus?.name}
            value={patientProgramRegistration.clinicalStatus?.id}
            category="programRegistryClinicalStatus"
            placeholder="—"
          />
        }
      />
      <PatientProgramRegistrationConditionsDetailsRow conditions={pprCondition} />
    </StyledScrollView>
  );
};
