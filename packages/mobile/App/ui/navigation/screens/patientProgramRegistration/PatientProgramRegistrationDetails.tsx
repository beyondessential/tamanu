import React from 'react';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS,
} from '~/constants/programRegistries';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { TranslatedText, TranslatedTextElement } from '~/ui/components/Translations/TranslatedText';

import { DateFormats } from '~/ui/helpers/constants';
import { formatStringDate } from '~/ui/helpers/date';
import { useBackendEffect } from '~/ui/hooks';
import { StyledScrollView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

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

// Keep in sync with @tamanu/web PatientProgramRegistryUpdateFormModal
const CONDITION_CATEGORY_GROUPS = {
  confirmedSection: [
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.SUSPECTED,
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNDER_INVESTIGATION,
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.CONFIRMED,
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.UNKNOWN,
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.IN_REMISSION,
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.NOT_APPLICABLE,
  ],
  resolvedSection: [
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
    PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
  ],
  recordedInErrorSection: [PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR],
};

const PatientProgramRegistrationConditionsDetailsRow = ({ conditions }) => {
  let conditionComponents;
  if (!Array.isArray(conditions) || conditions.length < 1) {
    conditionComponents = <StyledText>—</StyledText>;
  } else {
    const allCategories = Object.values(CONDITION_CATEGORY_GROUPS).flat();
    const orderedConditions = [...conditions].sort(
      (a, b) =>
        allCategories.indexOf(a.conditionCategory) - allCategories.indexOf(b.conditionCategory),
    );

    conditionComponents = orderedConditions.map(
      ({ programRegistryCondition, conditionCategory }) => (
        <>
          <StyledText
            marginBottom={10}
            marginLeft={20}
            fontSize={14}
            color={theme.colors.TEXT_SUPER_DARK}
            fontWeight={500}
          >
            <TranslatedReferenceData
              key={programRegistryCondition.id}
              fallback={programRegistryCondition.name}
              value={programRegistryCondition.id}
              category="programRegistryCondition"
            />
            {` (${PROGRAM_REGISTRY_CONDITION_CATEGORY_LABELS[conditionCategory]})`}
          </StyledText>
        </>
      ),
    );

    // Add a horizontal line between confirmed or resolved and recordedInErrorSection conditions
    if (
      orderedConditions.some(
        ({ conditionCategory }) =>
          CONDITION_CATEGORY_GROUPS.confirmedSection.includes(conditionCategory) ||
          CONDITION_CATEGORY_GROUPS.resolvedSection.includes(conditionCategory),
      ) &&
      orderedConditions.some(({ conditionCategory }) =>
        CONDITION_CATEGORY_GROUPS.recordedInErrorSection.includes(conditionCategory),
      )
    ) {
      conditionComponents.splice(
        orderedConditions.findIndex(({ conditionCategory }) =>
          CONDITION_CATEGORY_GROUPS.recordedInErrorSection.includes(conditionCategory),
        ),
        0,
        <HorizontalLine marginBottom={10} />,
      );
    }

    // Add a horizontal line between confirmed and resolved conditions
    if (
      orderedConditions.some(({ conditionCategory }) =>
        CONDITION_CATEGORY_GROUPS.confirmedSection.includes(conditionCategory),
      ) &&
      orderedConditions.some(({ conditionCategory }) =>
        CONDITION_CATEGORY_GROUPS.resolvedSection.includes(conditionCategory),
      )
    ) {
      conditionComponents.splice(
        orderedConditions.findIndex(({ conditionCategory }) =>
          CONDITION_CATEGORY_GROUPS.resolvedSection.includes(conditionCategory),
        ),
        0,
        <HorizontalLine marginBottom={10} />,
      );
    }
  }

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
      <StyledView width="60%">{conditionComponents}</StyledView>
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
