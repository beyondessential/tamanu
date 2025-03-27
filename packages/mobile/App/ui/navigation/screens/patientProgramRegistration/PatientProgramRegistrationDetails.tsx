import React from 'react';
import { sortBy, groupBy } from 'lodash';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '~/constants/programRegistries';
import {
  TranslatedReferenceData,
  getReferenceDataStringId,
} from '~/ui/components/Translations/TranslatedReferenceData';
import { TranslatedText, TranslatedTextElement } from '~/ui/components/Translations/TranslatedText';

import { DateFormats } from '~/ui/helpers/constants';
import { formatStringDate } from '~/ui/helpers/date';
import { useBackendEffect } from '~/ui/hooks';
import { StyledScrollView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const DataRow = ({
  label,
  value,
}: {
  label: TranslatedTextElement;
  value: TranslatedTextElement | TranslatedTextElement[];
}) => {
  return (
    <StyledView
      margin={20}
      marginTop={0}
      paddingBottom={20}
      flexDirection="row"
      justifyContent="flex-start"
      borderBottomWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
    >
      <StyledView width="40%">
        <StyledText fontSize={14} color={theme.colors.TEXT_MID} fontWeight={400}>
          {label}
        </StyledText>
      </StyledView>
      <StyledView width="60%">
        {Array.isArray(value) ? (
          value.map((x, i) => (
            <StyledText
              key={i}
              width="50%"
              marginBottom={10}
              marginLeft={20}
              fontSize={14}
              color={theme.colors.TEXT_SUPER_DARK}
              fontWeight={500}
            >
              {x}
            </StyledText>
          ))
        ) : (
          <StyledText
            width="50%"
            marginLeft={20}
            fontSize={14}
            color={theme.colors.TEXT_SUPER_DARK}
            fontWeight={500}
          >
            {value}
          </StyledText>
        )}
      </StyledView>
    </StyledView>
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

const PatientProgramRegistrationConditionsDetailsRow = ({ conditions }) => {
  const { getTranslation } = useTranslation();

  const initConditions = Array.isArray(conditions) ? conditions : [];
  // We hide recorded in error conditions
  const filteredConditions = initConditions.filter(
    ({ conditionCategory }) =>
      conditionCategory !== PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
  );

  // Sort alphabetically by condition name
  const sortedConditions = sortBy(filteredConditions, ({ programRegistryCondition }) => {
    const stringId = getReferenceDataStringId(
      'programRegistryCondition',
      programRegistryCondition.id,
    );
    return getTranslation(stringId, programRegistryCondition.name);
  });

  const groupedConditions = groupBy(sortedConditions, ({ conditionCategory }) =>
    [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
    ].includes(conditionCategory)
      ? 'closed'
      : 'open',
  );
  const needsDivider = groupedConditions.closed && groupedConditions.open;

  const TranslatedCondition = ({ condition }) => (
    <StyledText
      marginBottom={10}
      marginLeft={20}
      fontSize={14}
      color={theme.colors.TEXT_SUPER_DARK}
      fontWeight={500}
    >
      <TranslatedReferenceData
        key={condition.programRegistryCondition.id}
        fallback={condition.programRegistryCondition.name}
        value={condition.programRegistryCondition.id}
        category="programRegistryCondition"
      />
      {` (${PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[condition.conditionCategory]})`}
    </StyledText>
  );

  return (
    <StyledView
      margin={20}
      marginTop={0}
      paddingBottom={20}
      flexDirection="row"
      justifyContent="flex-start"
      borderBottomWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
    >
      <StyledView width="40%">
        <StyledText fontSize={14} color={theme.colors.TEXT_MID} fontWeight={400}>
          <TranslatedText stringId="programRegistry.conditions.label" fallback="Conditions" />
        </StyledText>
      </StyledView>
      <StyledView width="60%">
        {initConditions.length === 0 && <StyledText>—</StyledText>}
        {groupedConditions.open &&
          groupedConditions.open.map((condition, i) => (
            <TranslatedCondition key={`open-condition-${i}`} condition={condition} />
          ))}
        {needsDivider && <HorizontalLine marginBottom={10} />}
        {groupedConditions.closed &&
          groupedConditions.closed.map((condition, i) => (
            <TranslatedCondition key={`closed-condition-${i}`} condition={condition} />
          ))}
      </StyledView>
    </StyledView>
  );
};

export const PatientProgramRegistrationDetails = ({ route }) => {
  const { patientProgramRegistration } = route.params;
  const [pprCondition] = useBackendEffect(
    async ({ models }) =>
      models.PatientProgramRegistrationCondition.findForRegistryAndPatient(
        patientProgramRegistration.programRegistryId,
        patientProgramRegistration.patientId,
      ),
    [patientProgramRegistration],
  );
  return (
    <StyledScrollView background={theme.colors.WHITE}>
      <HorizontalLine marginBottom={20} />
      <DataRow
        label={
          <TranslatedText
            stringId="programRegistry.registrationDate.label"
            fallback="Date of registration"
          />
        }
        value={formatStringDate(patientProgramRegistration.date, DateFormats.DDMMYY)}
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
