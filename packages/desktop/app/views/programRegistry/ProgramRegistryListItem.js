import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';

const Spacer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;
const RowContents = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  width: 60%;
  align-items: center;
`;
const StatusActiveDot = styled.div`
  background-color: green;
  height: 7px;
  width: 7px;
  border-radius: 7px;
  margin: 0px 5px;
`;
const StatusInactiveDot = styled.div`
  background-color: lightGray;
  height: 7px;
  width: 7px;
  border-radius: 7px;
  margin: 0px 5px;
`;
const NameContainer = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0px;
  text-align: left;
`;

export const ProgramRegistryListItem = ({ item, ListItem }) => {
  const { programRegistry, registrationStatus, clinicalStatus } = item;
  const { navigateToProgramRegistry } = usePatientNavigation();
  return (
    <ListItem
      onClick={() => {
        navigateToProgramRegistry(programRegistry.id, programRegistry.name);
      }}
    >
      <Spacer>
        <RowContents>
          <Tooltip title={registrationStatus} arrow placement="top-end">
            {registrationStatus === REGISTRATION_STATUSES.ACTIVE ? (
              <StatusActiveDot />
            ) : (
              <StatusInactiveDot />
            )}
          </Tooltip>

          <NameContainer>{programRegistry.name}</NameContainer>
        </RowContents>
        <NameContainer>{clinicalStatus.name}</NameContainer>
      </Spacer>
    </ListItem>
  );
};
