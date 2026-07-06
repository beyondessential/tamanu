import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import styled, { css } from 'styled-components';

import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import {
  Button,
  ButtonWithPermissionCheck,
  DateDisplay,
  TranslatedEnum,
  TranslatedReferenceData,
  TranslatedText,
  useApi,
} from '@tamanu/ui-components';
import { usePatientCurrentEncounterQuery } from '../../../api/queries';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { DeathCertificateModal } from '../../../components/PatientPrinting';
import { PATIENT_STATUS, PATIENT_STATUS_COLORS } from '../../../constants';
import { Colors } from '../../../constants/styles';
import { useAuth } from '../../../contexts/Auth';
import { useLocalisation } from '../../../contexts/Localisation';
import { getEncounterStartDateLabel } from '../../../utils/getEncounterStartDateLabel';
import { getPatientStatus } from '../../../utils/getPatientStatus';
import { isEmergencyPatient } from '../../../utils/isEmergencyPatient';
import { getFullLocationName } from '../../../utils/location';

const Border = css`
  border: 1px solid ${Colors.outline};
  border-inline-start: 10px solid ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
  border-radius: 5px;
`;

const Container = styled.div`
  ${Border};
  background-color: ${p => p.theme.palette.background.paper};
  transition: color 0.2s ease;
`;

const NoVisitContainer = styled.div`
  ${Border};
  align-items: center;
  background-color: ${p => p.theme.palette.background.paper};
  display: flex;
  justify-content: space-between;
  padding-block: 28px;
  padding-inline: 30px;
`;

const Header = styled.div`
  align-items: center;
  border-block-end: 1px solid ${props => PATIENT_STATUS_COLORS[props.patientStatus]};
  display: flex;
  justify-content: flex-start;
  padding-block: 18px;
  padding-inline: 16px 20px;
`;

const Content = styled.div`
  display: grid;
  grid-row-gap: 8px;
  grid-template-columns: 1fr 1fr;
  padding-block: 12px;
  padding-inline: 16px 20px;
`;

const ContentItem = styled.div`
  display: flex;
`;

const Title = styled(Typography)`
  font-size: 18px;
  line-height: 24px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
`;

const BoldTitle = styled(Title)`
  color: ${props => props.theme.palette.text.primary};
  font-size: 18px;
  font-weight: 500;
  line-height: 1.33333333;
  margin-right: 5px;
`;

const NoVisitTitle = styled(BoldTitle)`
  font-size: 20px;
  line-height: 1.4;
`;

const ContentLabel = styled.span`
  color: ${Colors.darkContentText};
  font-weight: 500;
  margin-inline-end: 5px;
`;

const ContentText = styled.span`
  color: ${Colors.midContentText};
`;

const ButtonRow = styled(Box)`
  display: flex;
  align-items: center;

  button {
    margin-left: 18px;
  }
`;

const DeathLocationDisplay = ({ deathData }) => {
  if (deathData?.outsideHealthFacility) {
    return (
      <TranslatedText
        stringId="death.outsideHealthFacility.label"
        fallback="Died outside health facility"
      />
    );
  }

  if (deathData?.facility?.name) {
    return (
      <TranslatedReferenceData
        fallback={deathData.facility.name}
        value={deathData?.facility.id}
        category="facility"
      />
    );
  }

  return <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />;
};

const DataStatusMessage = ({ message }) => (
  <NoVisitContainer data-testid="novisitcontainer-xlql">
    <Typography variant="h6" data-testid="typography-vg0z">
      {message}
    </Typography>
  </NoVisitContainer>
);

const PatientDeathSummary = React.memo(({ patient }) => {
  const api = useApi();
  const {
    data: deathData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['patientDeathSummary', patient.id],
    queryFn: async () =>
      await api.get(
        `patient/${encodeURIComponent(patient.id)}/death`,
        {},
        { showUnknownErrorToast: false },
      ),
  });

  if (isLoading) {
    return (
      <DataStatusMessage
        message={<TranslatedText stringId="general.status.loading" fallback="Loading…" />}
        data-testid="datastatusmessage-yo4j"
      />
    );
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
            <TranslatedText stringId="death.deceased.label" fallback="Deceased" />
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
          <ContentLabel data-testid="contentlabel-nvid">
            <TranslatedText stringId="death.locationOfDeath.label" fallback="Location of death" />:
          </ContentLabel>
          <ContentText data-testid="contenttext-genv">
            <DeathLocationDisplay deathData={deathData} />
          </ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-sw3j">
          <ContentLabel data-testid="contentlabel-ybug">
            <TranslatedText
              stringId="general.localisedField.clinician.label"
              fallback="Clinician"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-9p0g">
            {deathData?.clinician?.displayName}
          </ContentText>
        </ContentItem>
        <ContentItem style={{ gridColumn: '1/-1' }} data-testid="contentitem-evco">
          <ContentLabel data-testid="contentlabel-4c0x">
            <TranslatedText
              stringId="death.underlyingConditionCausingDeath.label"
              fallback="Underlying condition causing death"
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-usv8">
            {deathData?.causes?.primary?.condition.id ? (
              <TranslatedReferenceData
                fallback={deathData?.causes?.primary?.condition.name}
                value={deathData?.causes?.primary?.condition.id}
                category={deathData?.causes?.primary?.condition.type}
              />
            ) : (
              <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />
            )}
          </ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-ld97">
          <ContentLabel data-testid="contentlabel-yujn">
            <TranslatedText stringId="death.dateOfDeath.label" fallback="Date of death" />:
          </ContentLabel>
          <ContentText data-testid="contenttext-08c1">
            <DateDisplay date={deathData?.dateOfDeath} data-testid="datedisplay-55sx" />
          </ContentText>
        </ContentItem>
      </Content>
    </Container>
  );
});

export const PatientEncounterSummary = ({ patient, viewEncounter, openCheckIn }) => {
  const { getLocalisation } = useLocalisation();
  const { ability } = useAuth();
  const { data: encounter, error, isLoading } = usePatientCurrentEncounterQuery(patient.id);
  const triage = encounter?.triages?.[0];

  if (patient.dateOfDeath) {
    return <PatientDeathSummary patient={patient} data-testid="patientdeathsummary-uven" />;
  }

  if (isLoading) {
    return (
      <DataStatusMessage
        message={<TranslatedText stringId="general.status.loading" fallback="Loading…" />}
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
            fallback="No current visit"
          />
        </NoVisitTitle>
        <ButtonRow data-testid="buttonrow-qss7">
          <NoteModalActionBlocker>
            <ButtonWithPermissionCheck
              onClick={openCheckIn}
              verb="create"
              noun="Encounter"
              data-testid="buttonwithpermissioncheck-o4ea"
            >
              <TranslatedText
                stringId="patient.encounterSummary.adminOrCheckIn"
                fallback="Admit or check in"
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
          <TranslatedText stringId="general.type.label" fallback="Type" />:
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
              />
            </>
          ) : (
            ''
          )}
        </Title>
        <Button
          onClick={() => viewEncounter(id)}
          size="small"
          data-testid="button-t8zb"
          disabled={!canReadEncounter}
          style={{ marginInlineStart: 'auto' }}
        >
          <TranslatedText
            stringId="patient.encounterSummary.viewEncounter"
            fallback="View encounter"
          />
        </Button>
      </Header>
      <Content data-testid="content-j9id">
        <ContentItem data-testid="contentitem-hcvt">
          <ContentLabel data-testid="contentlabel-tez6">
            <TranslatedText
              stringId="patient.encounterSummary.currentAdmission"
              fallback="Current admission"
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
                  />
                ),
              }}
            />
            :
          </ContentLabel>
          <ContentText data-testid="contenttext-73tz">{examiner?.displayName || '-'}</ContentText>
        </ContentItem>
        <ContentItem data-testid="contentitem-xmgk">
          <ContentLabel data-testid="contentlabel-zfve">
            <TranslatedText stringId="general.location.label" fallback="Location" />:
          </ContentLabel>
          <ContentText data-testid="contenttext-yn8i">{getFullLocationName(location)}</ContentText>
        </ContentItem>
        {!getLocalisation('referralSourceId.hidden') && (
          <ContentItem data-testid="contentitem-bsgv">
            <ContentLabel data-testid="contentlabel-p2o9">
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
              />
              :
            </ContentLabel>
            <ContentText data-testid="contenttext-di6y">
              {referralSourceId ? (
                <TranslatedReferenceData
                  category="referralSource"
                  fallback={referralSource?.name}
                  value={referralSourceId}
                />
              ) : (
                referralSource?.name || '—' // em dash
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
        {isEmergencyPatient(encounterType) ? (
          <>
            <ContentItem style={{ gridColumn: 2 }} data-testid="contentitem-chiefcomplaint">
              <ContentLabel data-testid="contentlabel-chiefcomplaint">
                <TranslatedText stringId="triage.chiefComplaint.label" fallback="Chief complaint" />
                :
              </ContentLabel>
              <ContentText data-testid="contenttext-chiefcomplaint">
                <TranslatedReferenceData
                  category="triageReason"
                  value={triage?.chiefComplaint?.id}
                  fallback={triage?.chiefComplaint?.name}
                  placeholder="—"
                />
              </ContentText>
            </ContentItem>
            <ContentItem style={{ gridColumn: 2 }} data-testid="contentitem-secondarycomplaint">
              <ContentLabel data-testid="contentlabel-secondarycomplaint">
                <TranslatedText
                  stringId="triage.secondaryComplaint.label"
                  fallback="Secondary complaint"
                />
                :
              </ContentLabel>
              <ContentText data-testid="contenttext-secondarycomplaint">
                <TranslatedReferenceData
                  category="triageReason"
                  value={triage?.secondaryComplaint?.id}
                  fallback={triage?.secondaryComplaint?.name}
                  placeholder="—"
                />
              </ContentText>
            </ContentItem>
          </>
        ) : (
          <ContentItem data-testid="contentitem-t8nz">
            <ContentLabel data-testid="contentlabel-p85w">
              <TranslatedText
                stringId="encounter.reasonForEncounter.label"
                fallback="Reason for encounter"
              />
              :
            </ContentLabel>
            <ContentText data-testid="contenttext-wf93">
              {reasonForEncounter || '—' /* em dash */}
            </ContentText>
          </ContentItem>
        )}
      </Content>
    </Container>
  );
};
