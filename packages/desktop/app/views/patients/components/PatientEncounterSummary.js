import React from 'react';
import styled, { css } from 'styled-components';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { Box, Typography } from '@material-ui/core';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { Notification, DateDisplay, LargeButton } from '../../../components';
import { DeathCertificateModal } from '../../../components/DeathCertificateModal';

const PATIENT_STATUS = {
  INPATIENT: 'inpatient',
  OUTPATIENT: 'outpatient',
  EMERGENCY: 'emergency',
  DECEASED: 'deceased',
};

const PATIENT_STATUS_COLORS = {
  [PATIENT_STATUS.INPATIENT]: Colors.safe, // Green
  [PATIENT_STATUS.OUTPATIENT]: Colors.secondary, // Yellow
  [PATIENT_STATUS.EMERGENCY]: Colors.orange, // Orange
  [PATIENT_STATUS.DECEASED]: Colors.midText, // grey
  [undefined]: Colors.primary, // Blue
};

const ENCOUNTER_TYPE_TO_STATUS = {
  [ENCOUNTER_TYPES.ADMISSION]: PATIENT_STATUS.INPATIENT,
  [ENCOUNTER_TYPES.CLINIC]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.IMAGING]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.OBSERVATION]: PATIENT_STATUS.OUTPATIENT,
  [ENCOUNTER_TYPES.EMERGENCY]: PATIENT_STATUS.EMERGENCY,
  [ENCOUNTER_TYPES.TRIAGE]: PATIENT_STATUS.EMERGENCY,
};

const Border = css`
  border: 1px solid ${Colors.outline};
  border-left: 10px solid ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
  border-radius: 10px;
`;

const Container = styled.div`
  ${Border};
  margin: 1rem;
  background: ${Colors.white};
  transition: color 0.2s ease;

  &:hover {
    cursor: pointer;
    background: ${Colors.offWhite};
  }
`;

const NoVisitContainer = styled.div`
  ${Border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${Colors.white};
  margin: 1rem;
  padding: 28px 30px;
`;

const Header = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 18px 20px 18px 16px;
  border-bottom: 1px solid ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 8px 20px 8px 16px;
`;

const ContentItem = styled.div`
  display: flex;
  padding: 8px 0;
`;

const Title = styled(Typography)`
  font-size: 18px;
  line-height: 24px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
  text-transform: capitalize;
`;

const BoldTitle = styled(Title)`
  font-size: 18px;
  line-height: 24px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
  margin-right: 5px;
`;

const NoVisitTitle = styled(BoldTitle)`
  font-size: 20px;
  line-height: 28px;
`;

const ContentLabel = styled.span`
  font-weight: 500;
  color: ${Colors.darkContentText};
  margin-right: 5px;
`;

const ContentText = styled.span`
  color: ${Colors.midContentText};
  text-transform: capitalize;
`;

const ButtonRow = styled(Box)`
  display: flex;
  align-items: center;

  button {
    margin-left: 18px;
  }
`;

export const PatientEncounterSummary = ({
  patient,
  viewEncounter,
  openCheckin,
  openTriage,
  encounter,
}) => {
  if (patient.dateOfDeath) {
    // Todo: Complete patient landing screen for deceased patients once api for death workflow is done @see WAITM-31
    // return (
    //   <Container>
    //     <Notification message="This patient has a date of death recorded, but the patient death workflow is not yet supported in Tamanu Desktop. Please contact your system administrator for more information." />
    //   </Container>
    // );

    return (
      <Container patientStatus={PATIENT_STATUS.DECEASED}>
        <Header patientStatus={PATIENT_STATUS.DECEASED}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flex="1">
            <BoldTitle variant="h3">Deceased</BoldTitle>
            <DeathCertificateModal patient={patient} />
          </Box>
        </Header>
        <Content>
          <ContentItem>
            <ContentLabel>Location of death:</ContentLabel>
            <ContentText>Fiji National Hospital</ContentText>
          </ContentItem>
          <ContentItem>
            <ContentLabel>Clinician:</ContentLabel>
            <ContentText>Dr Jane Brown</ContentText>
          </ContentItem>
          <ContentItem>
            <ContentLabel>Underlying condition causing death:</ContentLabel>
            <ContentText>Diabetes</ContentText>
          </ContentItem>
          <ContentItem>
            <ContentLabel>Date of death:</ContentLabel>
            <ContentText>23/11/2021</ContentText>
          </ContentItem>
        </Content>
      </Container>
    );
  }

  if (!encounter) {
    return (
      <NoVisitContainer>
        <NoVisitTitle variant="h2">No Current Visit</NoVisitTitle>
        <ButtonRow>
          <LargeButton onClick={openCheckin}>Admit or check-in</LargeButton>
          <LargeButton onClick={openTriage}>Triage</LargeButton>
        </ButtonRow>
      </NoVisitContainer>
    );
  }

  const { startDate, location, encounterType, reasonForEncounter, id, examiner } = encounter;
  const patientStatus = ENCOUNTER_TYPE_TO_STATUS[encounterType];

  return (
    <Container patientStatus={patientStatus} onClick={() => viewEncounter(id)}>
      <Header patientStatus={patientStatus}>
        <BoldTitle variant="h3">Type:</BoldTitle>
        <Title variant="h3">{ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label}</Title>
      </Header>
      <Content>
        <ContentItem>
          <ContentLabel>Current Admission:</ContentLabel>
          <ContentText>{patientStatus}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>Supervising doctor/nurse:</ContentLabel>
          <ContentText>{examiner?.displayName || '-'}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>Location:</ContentLabel>
          <ContentText>{location?.name || '-'}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>Reason for encounter:</ContentLabel>
          <ContentText>{reasonForEncounter}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>Arrival date:</ContentLabel>
          <ContentText>
            <DateDisplay date={startDate} />
          </ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
};
