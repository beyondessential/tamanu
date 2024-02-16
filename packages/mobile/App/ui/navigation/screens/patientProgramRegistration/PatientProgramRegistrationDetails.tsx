import React from 'react';
import { DateFormats } from '~/ui/helpers/constants';
import { formatStringDate } from '~/ui/helpers/date';
import { useBackendEffect } from '~/ui/hooks/index';
import { FullView, StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

const DataRow = (props: { label: string; value: string | string[] }) => {
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
      <StyledView width={'40%'}>
        <StyledText fontSize={14} color={theme.colors.TEXT_MID} fontWeight={400}>
          {props.label}
        </StyledText>
      </StyledView>
      <StyledView width={'60%'}>
        {Array.isArray(props.value) ? (
          props.value.map((x, i) => (
            <StyledText
              key={i}
              width={'50%'}
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
            width={'50%'}
            marginLeft={20}
            fontSize={14}
            color={theme.colors.TEXT_SUPER_DARK}
            fontWeight={500}
          >
            {props.value}
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
      await models.PatientProgramRegistrationCondition.findForRegistryAndPatient(
        patientProgramRegistration.programRegistryId,
        patientProgramRegistration.patientId,
      ),
    [patientProgramRegistration],
  );
  return (
    <FullView background={theme.colors.WHITE}>
      <StyledView
        borderColor={theme.colors.BOX_OUTLINE}
        borderBottomWidth={1}
        marginBottom={20}
      ></StyledView>
      <DataRow
        label="Date of registration"
        value={formatStringDate(patientProgramRegistration.date, DateFormats.DDMMYY)}
      />
      <DataRow label="Registered by" value={patientProgramRegistration?.clinician?.displayName} />
      <DataRow
        label="Registration facility"
        value={patientProgramRegistration.registeringFacility.name}
      />
      <DataRow label="Status" value={patientProgramRegistration?.clinicalStatus?.name || '-'} />
      <DataRow
        label="Conditions"
        value={
          Array.isArray(pprCondition) && pprCondition.length > 0
            ? pprCondition.map(x => x.programRegistryCondition.name)
            : '-'
        }
      />
    </FullView>
  );
};
