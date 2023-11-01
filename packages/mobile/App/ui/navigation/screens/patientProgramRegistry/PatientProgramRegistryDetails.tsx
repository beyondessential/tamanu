import React from 'react';
import { DateFormats } from '~/ui/helpers/constants';
import { formatStringDate } from '~/ui/helpers/date';
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

export const PatientProgramRegistryDetails = ({ route }) => {
  const { patientProgramRegistry } = route.params;
  return (
    <FullView background={theme.colors.WHITE}>
      <StyledView
        borderColor={theme.colors.BOX_OUTLINE}
        borderBottomWidth={1}
        marginBottom={20}
      ></StyledView>
      <DataRow
        label="Date of registration"
        value={formatStringDate(patientProgramRegistry.date, DateFormats.DDMMYY)}
      />
      <DataRow label="Registered by" value={patientProgramRegistry.clinician.displayName} />
      <DataRow
        label="Registration facility"
        value={patientProgramRegistry.registeringFacility.name}
      />
      <DataRow label="Status" value={patientProgramRegistry.clinicalStatus.name || '-'} />
      <DataRow
        label="Conditions"
        value={
          Array.isArray(patientProgramRegistry.conditions) &&
          patientProgramRegistry.conditions.length > 0
            ? patientProgramRegistry.conditions.map(x => x.name)
            : '-'
        }
      />
    </FullView>
  );
};
