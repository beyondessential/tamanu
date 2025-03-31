import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE, PATIENT_STATUS, PATIENT_STATUS_COLORS } from '../../../constants';
import { Button, ButtonWithPermissionCheck, DateDisplay } from '../../../components';
import { DeathCertificateModal } from '../../../components/PatientPrinting';
import { useApi } from '../../../api';
import { getFullLocationName } from '../../../utils/location';
import { getPatientStatus } from '../../../utils/getPatientStatus';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientCurrentEncounterQuery } from '../../../api/queries';
import { TranslatedReferenceData, TranslatedText } from '../../../components/Translation';

const Border = css`
  border: 1px solid ${Colors.outline};
  border-left: 10px solid ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
  border-radius: 5px;
`;

const Container = styled.div`
  ${Border};
  background: ${Colors.white};
  transition: color 0.2s ease;
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
              (deathData?.facility?.name && (
                <TranslatedReferenceData
                  fallback={deathData.facility.name}
                  value={deathData?.facility.id}
                  category="facility"
                  data-testid='translatedreferencedata-i9ah' />
              )) ||
              'Unknown'}
          </ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid='translatedtext-zstx' />
            :
          </ContentLabel>
          <ContentText>{deathData?.clinician?.displayName}</ContentText>
        </ContentItem>
        <ContentItem style={{ gridColumn: '1/-1' }}>
          <ContentLabel>Underlying condition causing death:</ContentLabel>
          <ContentText>
            {deathData?.causes?.primary?.condition.id ? (
              <TranslatedReferenceData
                fallback={deathData?.causes?.primary?.condition.name}
                value={deathData?.causes?.primary?.condition.id}
                category={deathData?.causes?.primary?.condition.type}
                data-testid='translatedreferencedata-xd6r' />
            ) : (
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                data-testid='translatedtext-lkg4' />
            )}
          </ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>Date of death:</ContentLabel>
          <ContentText>
            <DateDisplay date={deathData?.dateOfDeath} data-testid='datedisplay-oa2e' />
          </ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
});

export const PatientEncounterSummary = ({ patient, viewEncounter, openCheckin }) => {
  const { getLocalisation } = useLocalisation();
  const { data: encounter, error, isLoading } = usePatientCurrentEncounterQuery(patient.id);

  if (patient.dateOfDeath) {
    return <PatientDeathSummary patient={patient} />;
  }

  if (isLoading) {
    return (
      <DataStatusMessage
        message={<TranslatedText
          stringId="general.status.loading"
          fallback="Loading..."
          data-testid='translatedtext-zhjj' />}
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
            data-testid='translatedtext-o6ob' />
        </NoVisitTitle>
        <ButtonRow data-testid='buttonrow-r3o2'>
          <ButtonWithPermissionCheck
            onClick={openCheckin}
            verb="create"
            noun="Encounter"
            data-testid='buttonwithpermissioncheck-c2ck'>
            <TranslatedText
              stringId="patient.encounterSummary.adminOrCheckIn"
              fallback="Admit or check-in"
              data-testid='translatedtext-yy4p' />
          </ButtonWithPermissionCheck>
        </ButtonRow>
      </NoVisitContainer>
    );
  }

  const {
    startDate,
    location,
    referralSource,
    referralSourceId,
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
          <TranslatedText
            stringId="general.type.label"
            fallback="Type"
            data-testid='translatedtext-gw4j' />:
        </BoldTitle>
        <Title variant="h3">
          {ENCOUNTER_OPTIONS_BY_VALUE[encounterType].label}
          {location?.facility?.name ? (
            <>
              {' | '}
              <TranslatedReferenceData
                fallback={location?.facility.name}
                value={location?.facility.id}
                category="facility"
                data-testid='translatedreferencedata-bvzc' />
            </>
          ) : (
            ''
          )}
        </Title>
        <div style={{ flexGrow: 1 }} />
        <Button onClick={() => viewEncounter(id)} size="small" data-testid='button-86sz'>
          <TranslatedText
            stringId="patient.encounterSummary.viewEncounter"
            fallback="View encounter"
            data-testid='translatedtext-qmbd' />
        </Button>
      </Header>
      <Content>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="patient.encounterSummary.currentAdmission"
              fallback="Current admission"
              data-testid='translatedtext-ka89' />
            :
          </ContentLabel>
          <ContentText>{patientStatus}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="general.supervisingClinician.label"
              fallback="Supervising :clinician"
              replacements={{
                clinician: (
                  <TranslatedText
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                    casing="lower"
                    data-testid='translatedtext-u2vc' />
                ),
              }}
              data-testid='translatedtext-5rgj' />
            :
          </ContentLabel>
          <ContentText>{examiner?.displayName || '-'}</ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="general.location.label"
              fallback="Location"
              data-testid='translatedtext-elye' />:
          </ContentLabel>
          <ContentText>{getFullLocationName(location)}</ContentText>
        </ContentItem>
        {!getLocalisation('referralSourceId.hidden') && (
          <ContentItem>
            <ContentLabel>
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
                data-testid='translatedtext-43u0' />
              :
            </ContentLabel>
            <ContentText>
              {referralSourceId ? (
                <TranslatedReferenceData
                  category="referralSource"
                  fallback={referralSource?.name}
                  value={referralSourceId}
                  data-testid='translatedreferencedata-g1v2' />
              ) : (
                referralSource?.name || '-'
              )}
            </ContentText>
          </ContentItem>
        )}
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="patient.encounterSummary.arrivalDate"
              fallback="Arrival date"
              data-testid='translatedtext-29as' />
            :
          </ContentLabel>
          <ContentText>
            <DateDisplay date={startDate} data-testid='datedisplay-2x90' />
          </ContentText>
        </ContentItem>
        <ContentItem>
          <ContentLabel>
            <TranslatedText
              stringId="encounter.reasonForEncounter.label"
              fallback="Reason for encounter"
              data-testid='translatedtext-n6iu' />
            :
          </ContentLabel>
          <ContentText>{reasonForEncounter}</ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
};
