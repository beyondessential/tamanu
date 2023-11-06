import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE, PATIENT_STATUS } from '../../../constants';
import {
  DateDisplay,
  Button,
  ButtonWithPermissionCheck,
  useLocalisedText,
} from '../../../components';
import { DeathCertificateModal } from '../../../components/PatientPrinting';
import { useApi } from '../../../api';
import { getFullLocationName } from '../../../utils/location';
import { getPatientStatus } from '../../../utils/getPatientStatus';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientCurrentEncounter } from '../../../api/queries';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const PATIENT_STATUS_COLORS = {
  [PATIENT_STATUS.INPATIENT]: Colors.safe, // Green
  [PATIENT_STATUS.OUTPATIENT]: Colors.secondary, // Yellow
  [PATIENT_STATUS.EMERGENCY]: Colors.orange, // Orange
  [PATIENT_STATUS.DECEASED]: Colors.midText, // grey
  [undefined]: Colors.primary, // Blue
};

const Border = css`
  border: 1px solid ${Colors.outline};
  border-left: 10px solid ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
  border-radius: 5px;
`;

const Container = styled.div`
  ${Border};
  background: ${Colors.white};
  transition: color 0.2s ease;
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
`;

const NoVisitContainer = styled.div`
  ${Border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${Colors.white};
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
  padding: 12px 20px 12px 16px;
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

const DataStatusMessage = ({ message }) => (
  <NoVisitContainer>
    <Typography variant="h6">{message}</Typography>
  </NoVisitContainer>
);

const PatientDeathSummary = React.memo(({ patient }) => {
  const api = useApi();
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

  const { data: deathData, error, isLoading } = useQuery(['patientDeathSummary', patient.id], () =>
    api.get(`patient/${patient.id}/death`, {}, { showUnknownErrorToast: false }),
  );

  if (isLoading) {
    return <DataStatusMessage message="Loading..." />;
  }

  if (error) {
    return <DataStatusMessage message={error.message} />;
  }

  return (
    <Container patientStatus={PATIENT_STATUS.DECEASED}>
      <Header patientStatus={PATIENT_STATUS.DECEASED}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flex="1">
          <BoldTitle variant="h3">Deceased</BoldTitle>
          <DeathCertificateModal patient={patient} deathData={deathData} />
        </Box>
      </Header>
      <Content>
        <ContentItem>
          <ContentLabel>Place of death:</ContentLabel>
          <ContentText>
            {(deathData?.outsideHealthFacility && 'Died outside health facility') ||
              deathData?.facility?.name ||
              'Unknown'}
          </ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>{clinicianText}:</ContentLabel>
          <ContentText>{deathData?.clinician?.displayName}</ContentText>
        </ContentItem>
        <ContentItem style={{ gridColumn: '1/-1' }}>
          <ContentLabel>Underlying condition causing death:</ContentLabel>
          <ContentText>{deathData?.causes?.primary?.condition.name}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>Date of death:</ContentLabel>
          <ContentText>
            <DateDisplay date={deathData?.dateOfDeath} />
          </ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
});

export const PatientEncounterSummary = ({ patient, viewEncounter, openCheckin }) => {
  const { getLocalisation } = useLocalisation();
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });
  const { data: encounter, error, isLoading } = usePatientCurrentEncounter(patient.id);
  const referralSourcePath = 'fields.referralSourceId';

  if (patient.dateOfDeath) {
    return <PatientDeathSummary patient={patient} />;
  }

  if (isLoading) {
    return (
      <DataStatusMessage
        message={<TranslatedText stringId="general.status.loading" fallback="Loading..." />}
      />
    );
  }

  if (error) {
    return <DataStatusMessage message={error.message} />;
  }

  if (!encounter) {
    return (
      <NoVisitContainer>
        <NoVisitTitle variant="h2">
          <TranslatedText
            stringId="patient.encounterSummary.noCurrentVisit"
            fallback="No Current Visit"
          />
        </NoVisitTitle>
        <ButtonRow>
          <ButtonWithPermissionCheck onClick={openCheckin} verb="create" noun="Encounter">
            <TranslatedText
              stringId="patient.encounterSummary.adminOrCheckIn"
              fallback="Admit or check-in"
            />
          </ButtonWithPermissionCheck>
        </ButtonRow>
      </NoVisitContainer>
    );
  }

  const {
    startDate,
    location,
    referralSource,
    encounterType,
    reasonForEncounter,
    id,
    examiner,
  } = encounter;

  const patientStatus = getPatientStatus(encounterType);

  return (
    <Container patientStatus={patientStatus}>
      <Header patientStatus={patientStatus}>
        <BoldTitle variant="h3">
          <TranslatedText stringId="general.form.type.label" fallback="Type" />:
        </BoldTitle>
        <Title variant="h3">
          {ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label}
          {location?.facility?.name ? ` | ${location?.facility?.name}` : ''}
        </Title>
        <div style={{ flexGrow: 1 }} />
        <Button onClick={() => viewEncounter(id)} size="small">
          <TranslatedText
            stringId="patient.encounterSummary.viewEncounter"
            fallback="View encounter"
          />
        </Button>
      </Header>
      <Content>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="patient.encounterSummary.currentAdmission"
              fallback="Current Admission"
            />
            :
          </ContentLabel>
          <ContentText>{patientStatus}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="patient.encounterSummary.supervising"
              fallback="Supervising"
            />{' '}
            {clinicianText.toLowerCase()}:
          </ContentLabel>
          <ContentText>{examiner?.displayName || '-'}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText stringId="patient.encounterSummary.location" fallback="Location" />:
          </ContentLabel>
          <ContentText>{getFullLocationName(location)}</ContentText>
        </ContentItem>
        {!getLocalisation(`${referralSourcePath}.hidden`) && (
          <ContentItem>
            <ContentLabel>{getLocalisation(`${referralSourcePath}.shortLabel`)}:</ContentLabel>
            <ContentText>{referralSource?.name || '-'}</ContentText>
          </ContentItem>
        )}
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="patient.encounterSummary.arrivalDate"
              fallback="Arrival date"
            />
            :
          </ContentLabel>
          <ContentText>
            <DateDisplay date={startDate} />
          </ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="patient.encounterSummary.reasonForEncounter"
              fallback="Reason for encounter"
            />
            :
          </ContentLabel>
          <ContentText>{reasonForEncounter}</ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
};
