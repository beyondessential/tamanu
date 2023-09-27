import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';
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
  const { id, name, status, clinicalStatus } = item;
  const { navigateToProgramRegistry } = usePatientNavigation();
  return (
    <ListItem
      onClick={() => {
        navigateToProgramRegistry(id, name);
      }}
    >
      <Spacer>
        <RowContents>
          <Tooltip title={status} arrow placement="top-end">
            {status === 'Active' ? <StatusActiveDot /> : <StatusInactiveDot />}
          </Tooltip>

          <NameContainer>{name}</NameContainer>
        </RowContents>
        <NameContainer>{clinicalStatus}</NameContainer>
      </Spacer>
    </ListItem>
  );
};
