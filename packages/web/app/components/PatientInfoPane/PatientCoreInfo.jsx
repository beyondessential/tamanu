import React, { memo } from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { TranslatedSex, TranslatedText, useTranslation, DateDisplay } from '@tamanu/ui-components';
import { PatientPhotoAvatar } from './PatientPhotoAvatar';
import { useSettings } from '../../contexts/Settings';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getDisplayAge } from '../../utils/dateTime';
import { PATIENT_STATUS_COLORS, Colors } from '../../constants';

const PatientHeader = styled.div`
  position: relative;
  padding: 25px 35px 35px 25px;
  text-align: left;

  &:hover {
    background: #f4f9ff;
  }
`;

// Covers the whole header so the name still navigates to the patient, while leaving the avatar
// beside it free to carry its own controls rather than nesting them in a button
const PatientNavButton = styled.button`
  position: absolute;
  inset: 0;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
`;

const NameHeader = styled(Typography)`
  pointer-events: none;
  align-self: flex-start;
  color: ${(props) => props.theme.palette.text.tertiary};
  font-size: 11px;
  line-height: 15px;
  margin-bottom: 20px;
`;

const NameText = styled(Typography)`
  font-size: 24px;
  line-height: 32px;
  text-transform: capitalize;
`;

const NameContainer = styled.div`
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CoreInfoSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 3.5fr;
  border-bottom: 1px solid ${Colors.softOutline};
  border-top: 1px solid ${Colors.softOutline};
  padding-left: 10px;
`;

const CoreInfoCellContainer = styled.div`
  :first-of-type {
    border-right: 1px solid ${Colors.softOutline};
  }

  padding: 10px 15px;
`;

const CoreInfoLabel = styled(Typography)`
  color: ${(props) => props.theme.palette.text.tertiary};
  font-size: 14px;
  line-height: 18px;
`;

const CoreInfoValue = styled(Typography)`
  color: ${(props) => props.theme.palette.text.secondary};
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  text-transform: capitalize;
`;

const CoreInfoCell = ({ label, children, testId }) => (
  <CoreInfoCellContainer data-test-id={testId} data-testid="coreinfocellcontainer-miwt">
    <CoreInfoLabel data-testid="coreinfolabel-isbb">{label}</CoreInfoLabel>
    <CoreInfoValue data-testid="coreinfovalue-ycil">{children}</CoreInfoValue>
  </CoreInfoCellContainer>
);

const HealthIdContainer = styled.div`
  padding: 20px 10px 12px;
`;

const HealthId = styled.div`
  background: ${(props) => (
    props.isDeceased ? PATIENT_STATUS_COLORS.Deceased : props.theme.palette.primary.main
  )};
  color: ${Colors.white};
  font-weight: 600;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 3px;
`;

const HealthIdText = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;

const AgeDisplay = styled.span`
  color: ${Colors.midText};
  font-size: 14px;
  font-weight: 400;
  text-transform: none;
`;

const HealthIdDisplay = ({ displayId, isDeceased }) => (
  <HealthIdContainer data-testid="healthidcontainer-gdlx">
    <HealthId isDeceased={isDeceased} data-testid="healthid-6qrz">
      <HealthIdText data-testid="healthidtext-v925">
        <TranslatedText
          stringId="general.localisedField.displayId.label"
          fallback="National Health Number"
          data-testid="translatedtext-spb3"
        />
      </HealthIdText>
      <HealthIdText data-test-class="display-id-label" data-testid="healthidtext-fqvn">
        {displayId}
      </HealthIdText>
    </HealthId>
  </HealthIdContainer>
);

export const CoreInfoDisplay = memo(({ patient }) => {
  const { navigateToPatient } = usePatientNavigation();
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();
  const ageDisplayFormat = getSetting('ageDisplayFormat');
  const ageText = patient.dateOfDeath
    ? getTranslation('patient.detailsSidebar.deceased', 'deceased')
    : getDisplayAge(patient.dateOfBirth, ageDisplayFormat);

  return (
    <>
      <PatientHeader data-testid="patientbutton-7qal">
        <PatientNavButton
          type="button"
          onClick={() => navigateToPatient(patient.id)}
          aria-label={getTranslation('patient.detailsSidebar.title', 'Patient details')}
          data-testid="patientnavbutton-7qal"
        />
        <NameHeader data-testid="nameheader-22n1">
          <TranslatedText
            stringId="patient.detailsSidebar.title"
            fallback="Patient details"
            data-testid="translatedtext-gzkw"
          />
        </NameHeader>
        <NameContainer data-testid="namecontainer-047h">
          <div>
            <NameText data-test-id="core-info-patient-first-name" data-testid="nametext-ns8a">
              {patient.firstName}
            </NameText>
            <NameText data-test-id="core-info-patient-last-name" data-testid="nametext-ttwn">
              {patient.lastName}
            </NameText>
          </div>
          <PatientPhotoAvatar patient={patient} />
        </NameContainer>
      </PatientHeader>
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
      <HealthIdDisplay
        displayId={patient.displayId}
        isDeceased={Boolean(patient.dateOfDeath)}
        data-testid="healthiddisplay-su8y"
      />
    </>
  );
});
