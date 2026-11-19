import React, { memo } from 'react';
import styled from 'styled-components';
import { Button, Typography } from '@material-ui/core';
import {
  DateDisplay,
  TranslatedSex,
  TranslatedText,
  useTranslation,
} from '@tamanu/ui-components';
import { useSettings } from '../../contexts/Settings';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getDisplayAge } from '../../utils/dateTime';
import { PATIENT_STATUS_COLORS, Colors } from '../../constants';
import { GreyPill } from './InfoPanePill';

const PatientButton = styled(Button)`
  display: block;
  width: 100%;
  padding: 0;
  border-radius: 0;
  text-align: left;
  text-transform: none;

  &:hover {
    background: ${Colors.veryLightBlue};
  }
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 16px 0;
`;

const NameHeader = styled(Typography)`
  color: ${Colors.midText};
  font-size: 11px;
  line-height: 15px;
  text-transform: uppercase;
`;

const NameText = styled(Typography)`
  padding: 10px 16px;
  color: ${Colors.darkestText};
  font-size: 24px;
  line-height: 32px;
  text-transform: capitalize;
`;

const CoreInfoSection = styled.div`
  display: flex;
  border-top: 1px solid ${Colors.outline};
  border-bottom: 1px solid ${Colors.outline};
`;

const CoreInfoCellContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 18px;

  &:first-of-type {
    flex: 1;
  }
`;

const CoreInfoLabel = styled.span`
  color: ${Colors.midText};
`;

const CoreInfoValue = styled.span`
  color: ${Colors.darkText};
  font-weight: 500;
  text-transform: capitalize;
`;

const CoreInfoCell = ({ label, children, testId }) => (
  <CoreInfoCellContainer data-test-id={testId} data-testid="coreinfocellcontainer-miwt">
    <CoreInfoLabel data-testid="coreinfolabel-isbb">{label}</CoreInfoLabel>
    <CoreInfoValue data-testid="coreinfovalue-ycil">{children}</CoreInfoValue>
  </CoreInfoCellContainer>
);

const HealthId = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  border-radius: 3px;
  background: ${p => (p.$isDeceased ? PATIENT_STATUS_COLORS.Deceased : Colors.primary)};
  color: ${Colors.white};
  font-size: 14px;
  line-height: 18px;
`;

const HealthIdValue = styled.span`
  font-weight: 500;
`;

const AgeDisplay = styled.span`
  color: ${Colors.midText};
  font-weight: 400;
  text-transform: none;
`;

export const HealthIdDisplay = ({ displayId, isDeceased }) => (
  <HealthId $isDeceased={isDeceased} data-testid="healthid-6qrz">
    <span data-testid="healthidtext-v925">
      <TranslatedText
        stringId="general.localisedField.displayId.label"
        fallback="National Health Number"
        data-testid="translatedtext-spb3"
      />
    </span>
    <HealthIdValue data-test-class="display-id-label" data-testid="healthidtext-fqvn">
      {displayId}
    </HealthIdValue>
  </HealthId>
);

export const CoreInfoDisplay = memo(({ patient }) => {
  const { navigateToPatient } = usePatientNavigation();
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const ageDisplayFormat = getSetting('ageDisplayFormat');
  const isDeceased = Boolean(patient.dateOfDeath);
  const ageText = isDeceased
    ? getTranslation('patient.detailsSidebar.deceased', 'deceased')
    : getDisplayAge(patient.dateOfBirth, ageDisplayFormat);

  return (
    <>
      <PatientButton onClick={() => navigateToPatient(patient.id)} data-testid="patientbutton-7qal">
        <TitleRow>
          <NameHeader data-testid="nameheader-22n1">
            <TranslatedText
              stringId="patient.detailsSidebar.title"
              fallback="Patient details"
              data-testid="translatedtext-gzkw"
            />
          </NameHeader>
          {isDeceased && (
            <GreyPill data-testid="deceasedtag-sidebar">
              <TranslatedText stringId="death.deceased.label" fallback="Deceased" />
            </GreyPill>
          )}
        </TitleRow>
        <NameText data-testid="namecontainer-047h">
          <span data-test-id="core-info-patient-first-name" data-testid="nametext-ns8a">
            {patient.firstName}
          </span>{' '}
          <span data-test-id="core-info-patient-last-name" data-testid="nametext-ttwn">
            {patient.lastName}
          </span>
        </NameText>
      </PatientButton>
      <CoreInfoSection data-testid="coreinfosection-ri8t">
        <CoreInfoCell
          label={
            <TranslatedText
              stringId="general.localisedField.sex.label"
              fallback="Sex"
              data-testid="translatedtext-0qjl"
            />
          }
          testId="core-info-patient-sex"
          data-testid="coreinfocell-ztu4"
        >
          <TranslatedSex sex={patient.sex} data-testid="translatedsex-buqq" />
        </CoreInfoCell>
        <CoreInfoCell
          label={
            <TranslatedText
              stringId="general.localisedField.dateOfBirth.label.short"
              fallback="DOB"
              data-testid="translatedtext-rn4m"
            />
          }
          testId="core-info-patient-dob"
          data-testid="coreinfocell-0opr"
        >
          <DateDisplay date={patient.dateOfBirth} data-testid="datedisplay-ez8y" />
          <AgeDisplay data-testid="agedisplay-gpl9">{` (${ageText})`}</AgeDisplay>
        </CoreInfoCell>
      </CoreInfoSection>
    </>
  );
});
