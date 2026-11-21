import React from 'react';
import styled from 'styled-components';
import { ChevronRight } from 'lucide-react';
import { STATUS_COLOR } from '@tamanu/constants';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { TranslatedReferenceData } from '../../components';
import {
  InfoPaneChevron,
  InfoPaneRow,
  InfoPaneRowEnd,
  InfoPaneRowName,
} from '../../components/PatientInfoPane/InfoPaneListItem';
import { TruncatedPill } from '../../components/PatientInfoPane/InfoPanePill';

const RegistryName = styled(InfoPaneRowName)`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ProgramRegistryListItem = ({ item }) => {
  const { programRegistry, clinicalStatus } = item;
  const { navigateToProgramRegistry } = usePatientNavigation();
  return (
    <InfoPaneRow
      type="button"
      onClick={() => navigateToProgramRegistry(programRegistry.id, programRegistry?.name)}
      data-testid="listitem-n444"
    >
      <RegistryName data-testid="namecontainer-yxfz">
        <RegistrationStatusIndicator
          patientProgramRegistration={item}
          hideText
          style={{ margin: 0 }}
          data-testid="registrationstatusindicator-fpkc"
        />
        <TranslatedReferenceData
          value={programRegistry?.id}
          fallback={programRegistry?.name}
          category="programRegistry"
          data-testid="translatedreferencedata-gsb7"
        />
      </RegistryName>
      <InfoPaneRowEnd>
        {clinicalStatus && (
          <TruncatedPill
            $color={STATUS_COLOR[clinicalStatus.color]}
            style={{ maxWidth: 140 }}
            data-testid="namecontainer-cg55"
          >
            <TranslatedReferenceData
              fallback={clinicalStatus.name}
              value={clinicalStatus.id}
              category="programRegistryClinicalStatus"
              data-testid="translatedreferencedata-h9ub"
            />
          </TruncatedPill>
        )}
        <InfoPaneChevron Icon={ChevronRight} />
      </InfoPaneRowEnd>
    </InfoPaneRow>
  );
};
