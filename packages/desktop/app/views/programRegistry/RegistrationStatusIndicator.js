import React from 'react';
import styled from 'styled-components';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { Colors } from '../../constants';
import { capitaliseFirstLetter } from '../../utils/capitalise';
import { ThemedTooltip } from '../../components/Tooltip';

const StatusDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: center;
`;
const StatusActiveDot = styled.div`
  background-color: ${Colors.safe};
  height: 7px;
  width: 7px;
  border-radius: 10px;
  margin: 0px 5px;
`;
const StatusInactiveDot = styled.div`
  background-color: ${Colors.softText};
  height: 7px;
  width: 7px;
  border-radius: 10px;
  margin: 0px 5px;
`;

export const RegistrationStatusIndicator = ({ patientProgramRegistration, hideText, style }) => {
  return (
    <ThemedTooltip title={capitaliseFirstLetter(patientProgramRegistration.registrationStatus)}>
      <StatusDiv>
        {patientProgramRegistration.registrationStatus === REGISTRATION_STATUSES.ACTIVE ? (
          <StatusActiveDot style={style} />
        ) : (
          <StatusInactiveDot style={style} />
        )}
        {!hideText && <b>{capitaliseFirstLetter(patientProgramRegistration.registrationStatus)}</b>}
      </StatusDiv>
    </ThemedTooltip>
  );
};
