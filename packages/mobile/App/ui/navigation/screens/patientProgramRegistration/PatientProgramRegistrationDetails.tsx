import React from 'react';
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
      <StyledView borderColor={theme.colors.BOX_OUTLINE} borderBottomWidth={1} marginBottom={20} />
      <DataRow
        label={
          <TranslatedText
            stringId="patientProgramRegistry.date.label"
            fallback="Date of registration"
          />
        }
        value={formatStringDate(patientProgramRegistration.date, DateFormats.DDMMYY)}
      />
      <DataRow
        label={
          <TranslatedText
            stringId="patientProgramRegistry.registeredBy.label"
            fallback="Registered by"
          />
        }
        value={patientProgramRegistration?.clinician?.displayName}
      />
      <DataRow
        label={
          <TranslatedText
            stringId="patientProgramRegistry.registeringFacility.label"
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
        label={<TranslatedText stringId="general.status.label" fallback="Status" />}
        value={patientProgramRegistration?.clinicalStatus?.name || '—'}
      />
      <DataRow
        label={
          <TranslatedText
            stringId="patientProgramRegistry.conditions.label"
            fallback="Conditions"
          />
        }
        value={
          Array.isArray(pprCondition) && pprCondition.length > 0
            ? pprCondition.map(x => x.programRegistryCondition.name)
            : '—'
        }
      />
    </StyledScrollView>
  );
};
