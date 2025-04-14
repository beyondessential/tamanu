import React from 'react';
import styled from 'styled-components';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { TranslatedReferenceData } from '../../components';

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
      data-testid="listitem-n444"
    >
      <Spacer data-testid="spacer-8zgz">
        <RowContents style={{ width: '60%' }} data-testid="rowcontents-lq5c">
          <RegistrationStatusIndicator
            patientProgramRegistration={item}
            hideText
            data-testid="registrationstatusindicator-fpkc"
          />
          <NameContainer style={{ width: '90%' }} data-testid="namecontainer-yxfz">
            <TranslatedReferenceData
              value={programRegistry?.id}
              fallback={programRegistry?.name}
              category="programRegistry"
              data-testid="translatedreferencedata-gsb7"
            />
          </NameContainer>
        </RowContents>
        <NameContainer
          style={{ width: '38%', textAlign: 'right', paddingRight: '8px' }}
          data-testid="namecontainer-cg55"
        >
          <TranslatedReferenceData
            fallback={clinicalStatus?.name}
            value={clinicalStatus?.id}
            category="programRegistryClinicalStatus"
            data-testid="translatedreferencedata-h9ub"
          />
        </NameContainer>
      </Spacer>
    </ListItem>
  );
};
