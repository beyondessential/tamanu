import React from 'react';
import styled from 'styled-components';
import { PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { ThemedTooltip } from '../../components/Tooltip';

const StatusDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
`;
const StatusActiveDot = styled.div`
  background-color: green;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;
const StatusInactiveDot = styled.div`
  background-color: lightGray;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;

export const RegistrationStatusIndicator = ({ patientProgramRegistration, hideText }) => {
  return (
    <ThemedTooltip title={capitaliseFirstLetter(patientProgramRegistration.registrationStatus)}>
      <StatusDiv>
        {patientProgramRegistration.registrationStatus === PROGRAM_REGISTRATION_STATUSES.ACTIVE ? (
          <StatusActiveDot />
        ) : (
          <StatusInactiveDot />
        )}
        {!hideText && <b>{capitaliseFirstLetter(patientProgramRegistration.registrationStatus)}</b>}
      </StatusDiv>
    </ThemedTooltip>
  );
};
