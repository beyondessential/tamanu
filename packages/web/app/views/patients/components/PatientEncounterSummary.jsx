import React from 'react';
import styled, { css } from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { useQuery } from '@tanstack/react-query';
import { ButtonWithPermissionCheck, Button } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { PATIENT_STATUS, PATIENT_STATUS_COLORS } from '../../../constants';
import { DateDisplay } from '../../../components';
import { DeathCertificateModal } from '../../../components/PatientPrinting';
import { useApi } from '../../../api';
import { getFullLocationName } from '../../../utils/location';
import { getPatientStatus } from '../../../utils/getPatientStatus';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientCurrentEncounterQuery } from '../../../api/queries';
import {
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
} from '../../../components/Translation';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { getEncounterStartDateLabel } from '../../../utils/getEncounterStartDateLabel';
import { useAuth } from '../../../contexts/Auth';

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
  <NoVisitContainer data-testid="novisitcontainer-xlql">
    <Typography variant="h6" data-testid="typography-vg0z">
      {message}
    </Typography>
  </NoVisitContainer>
);

const PatientDeathSummary = React.memo(({ patient }) => {
  const api = useApi();

  const { data: deathData, error, isLoading } = useQuery(['patientDeathSummary', patient.id], () =>
    api.get(`patient/${patient.id}/death`, {}, { showUnknownErrorToast: false }),
  );

  if (isLoading) {
    return <DataStatusMessage message="Loading..." data-testid="datastatusmessage-yo4j" />;
  }

  if (error) {
    return <DataStatusMessage message={error.message} data-testid="datastatusmessage-d4l9" />;
  }

  return (
    <Container patientStatus={PATIENT_STATUS.DECEASED} data-testid="container-dl1r">
      <Header patientStatus={PATIENT_STATUS.DECEASED} data-testid="header-ryg3">
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flex="1"
          data-testid="box-5a71"
        >
          <BoldTitle variant="h3" data-testid="boldtitle-eb0y">
            Deceased
          </BoldTitle>
          <DeathCertificateModal
            patient={patient}
            deathData={deathData}
            data-testid="deathcertificatemodal-ryj2"
          />
        </Box>
      </Header>
      <Content data-testid="content-y0fh">
        <ContentItem data-testid="contentitem-xxod">
          <ContentLabel data-testid="contentlabel-nvid">Place of death:</ContentLabel>
          <ContentText data-testid="contenttext-genv">
            {(deathData?.outsideHealthFacility && 'Died outside health facility') ||
              (deathData?.facility?.name && (
                <TranslatedReferenceData
                  fallback={deathData.facility.name}
                  value={deathData?.facility.id}
                  category="facility"
                  data-testid="translatedreferencedata-c4cx"
                />
              )) ||
              'Unknown'}
          </ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-sw3j">
          <ContentLabel data-testid="contentlabel-ybug">
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
              data-testid="translatedtext-vg4s"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-9p0g">
            {deathData?.clinician?.displayName}
          </ContentText>
        </ContentItem>
        <ContentItem style={{ gridColumn: '1/-1' }} data-testid="contentitem-evco">
          <ContentLabel data-testid="contentlabel-4c0x">
            Underlying condition causing death:
          </ContentLabel>
          <ContentText data-testid="contenttext-usv8">
            {deathData?.causes?.primary?.condition.id ? (
              <TranslatedReferenceData
                fallback={deathData?.causes?.primary?.condition.name}
                value={deathData?.causes?.primary?.condition.id}
                category={deathData?.causes?.primary?.condition.type}
                data-testid="translatedreferencedata-a8fx"
              />
            ) : (
              <TranslatedText
                stringId="general.fallback.notApplicable"
                fallback="N/A"
                data-testid="translatedtext-eotw"
              />
            )}
          </ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-ld97">
          <ContentLabel data-testid="contentlabel-yujn">Date of death:</ContentLabel>
          <ContentText data-testid="contenttext-08c1">
            <DateDisplay date={deathData?.dateOfDeath} data-testid="datedisplay-55sx" />
          </ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
});

export const PatientEncounterSummary = ({ patient, viewEncounter, openCheckin }) => {
  const { getLocalisation } = useLocalisation();
  const { ability } = useAuth();
  const { data: encounter, error, isLoading } = usePatientCurrentEncounterQuery(patient.id);

  if (patient.dateOfDeath) {
    return <PatientDeathSummary patient={patient} data-testid="patientdeathsummary-uven" />;
  }

  if (isLoading) {
    return (
      <DataStatusMessage
        message={
          <TranslatedText
            stringId="general.status.loading"
            fallback="Loading…"
            data-testid="translatedtext-jp7h"
          />
        }
        data-testid="datastatusmessage-8kxn"
      />
    );
  }

  if (error) {
    return <DataStatusMessage message={error.message} data-testid="datastatusmessage-bwi6" />;
  }

  if (!encounter) {
    return (
      <NoVisitContainer data-testid="novisitcontainer-pf0x">
        <NoVisitTitle variant="h2" data-testid="novisittitle-4wsg">
          <TranslatedText
            stringId="patient.encounterSummary.noCurrentVisit"
            fallback="No Current Visit"
            data-testid="translatedtext-2oej"
          />
        </NoVisitTitle>
        <ButtonRow data-testid="buttonrow-qss7">
          <NoteModalActionBlocker>
            <ButtonWithPermissionCheck
              onClick={openCheckin}
              verb="create"
              noun="Encounter"
              data-testid="buttonwithpermissioncheck-o4ea"
            >
              <TranslatedText
                stringId="patient.encounterSummary.adminOrCheckIn"
                fallback="Admit or check-in"
                data-testid="translatedtext-rs08"
              />
            </ButtonWithPermissionCheck>
          </NoteModalActionBlocker>
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
  const canReadEncounter = ability.can('read', 'Encounter');

  return (
    <Container patientStatus={patientStatus} data-testid="container-2i3h">
      <Header patientStatus={patientStatus} data-testid="header-vf6f">
        <BoldTitle variant="h3" data-testid="boldtitle-r1hy">
          <TranslatedText
            stringId="general.type.label"
            fallback="Type"
            data-testid="translatedtext-xp21"
          />
          :
        </BoldTitle>
        <Title variant="h3" data-testid="title-il13">
          <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
          {location?.facility?.name ? (
            <>
              {' | '}
              <TranslatedReferenceData
                fallback={location?.facility.name}
                value={location?.facility.id}
                category="facility"
                data-testid="translatedreferencedata-dbxs"
              />
            </>
          ) : (
            ''
          )}
        </Title>
        <div style={{ flexGrow: 1 }} />
        {canReadEncounter && (
          <Button onClick={() => viewEncounter(id)} size="small" data-testid="button-t8zb">
            <TranslatedText
              stringId="patient.encounterSummary.viewEncounter"
              fallback="View encounter"
              data-testid="translatedtext-nqf5"
            />
          </Button>
        )}
      </Header>
      <Content data-testid="content-j9id">
        <ContentItem data-testid="contentitem-hcvt">
          <ContentLabel data-testid="contentlabel-tez6">
            <TranslatedText
              stringId="patient.encounterSummary.currentAdmission"
              fallback="Current admission"
              data-testid="translatedtext-6z2p"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-nhhp">{patientStatus}</ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-w27y">
          <ContentLabel data-testid="contentlabel-pwyp">
            <TranslatedText
              stringId="general.supervisingClinician.label"
              fallback="Supervising :clinician"
              replacements={{
                clinician: (
                  <TranslatedText
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                    casing="lower"
                    data-testid="translatedtext-4bmp"
                  />
                ),
              }}
              data-testid="translatedtext-hnws"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-73tz">{examiner?.displayName || '-'}</ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-xmgk">
          <ContentLabel data-testid="contentlabel-zfve">
            <TranslatedText
              stringId="general.location.label"
              fallback="Location"
              data-testid="translatedtext-sz4d"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-yn8i">{getFullLocationName(location)}</ContentText>
        </ContentItem>
        {!getLocalisation('referralSourceId.hidden') && (
          <ContentItem data-testid="contentitem-bsgv">
            <ContentLabel data-testid="contentlabel-p2o9">
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
                data-testid="translatedtext-xmmo"
              />
              :
            </ContentLabel>
            <ContentText data-testid="contenttext-di6y">
              {referralSourceId ? (
                <TranslatedReferenceData
                  category="referralSource"
                  fallback={referralSource?.name}
                  value={referralSourceId}
                  data-testid="translatedreferencedata-reyt"
                />
              ) : (
                referralSource?.name || '-'
              )}
            </ContentText>
          </ContentItem>
        )}
        <ContentItem data-testid="contentitem-o4pq">
          <ContentLabel data-testid="contentlabel-ws92">
            {getEncounterStartDateLabel(encounterType)}:
          </ContentLabel>
          <ContentText data-testid="contenttext-nw17">
            <DateDisplay date={startDate} data-testid="datedisplay-5hsh" />
          </ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-t8nz">
          <ContentLabel data-testid="contentlabel-p85w">
            <TranslatedText
              stringId="encounter.reasonForEncounter.label"
              fallback="Reason for encounter"
              data-testid="translatedtext-5vij"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-wf93">{reasonForEncounter}</ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
};
