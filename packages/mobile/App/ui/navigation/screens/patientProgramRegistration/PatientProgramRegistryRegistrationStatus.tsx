import React from 'react';
import styled from 'styled-components/native';
import { PROGRAM_REGISTRATION_STATUS_LABEL } from '~/constants/programRegistries';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

export const StatusContainer = styled.View`
  max-width: 100%;
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: baseline;
`;

export const PatientProgramRegistryRegistrationStatus = ({ registrationStatus }) => {
  const registrationStatusLabel = PROGRAM_REGISTRATION_STATUS_LABEL[registrationStatus];
  return (
    <StatusContainer>
      <StyledView
        borderRadius={100}
        height={7}
        width={7}
        background={
          registrationStatus === 'active' ? theme.colors.SAFE : theme.colors.DISABLED_GREY
        }
        marginTop={10}
        marginRight={15}
      />
      <StyledText fontSize={16} fontWeight={500}>
        {registrationStatusLabel}
      </StyledText>
    </StatusContainer>
  );
};
