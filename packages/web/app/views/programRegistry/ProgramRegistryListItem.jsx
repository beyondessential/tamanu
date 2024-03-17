import React from 'react';
import styled from 'styled-components';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';

const Spacer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  align-items: flex-start;
`;
const RowContents = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-items: baseline;
`;
const NameContainer = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0px;
  text-align: left;
`;

export const ProgramRegistryListItem = ({ item, ListItem }) => {
  const { programRegistry, clinicalStatus } = item;
  const { navigateToProgramRegistry } = usePatientNavigation();
  return (
    <ListItem
      onClick={() => {
        navigateToProgramRegistry(programRegistry.id, programRegistry?.name);
      }}
    >
      <Spacer>
        <RowContents style={{ width: '60%' }}>
          <RegistrationStatusIndicator patientProgramRegistration={item} hideText />
          <NameContainer style={{ width: '90%' }}>{programRegistry?.name}</NameContainer>
        </RowContents>
        <NameContainer style={{ width: '38%', textAlign: 'right', paddingRight: '8px' }}>{clinicalStatus?.name}</NameContainer>
      </Spacer>
    </ListItem>
  );
};
