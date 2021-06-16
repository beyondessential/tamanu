import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import styled from 'styled-components';

import { connectApi } from '../../api';

import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { PatientHistory } from '../../components/PatientHistory';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { ContentPane } from '../../components/ContentPane';
import { EncounterModal } from '../../components/EncounterModal';
import { TriageModal } from '../../components/TriageModal';
import { ReferralModal } from '../../components/ReferralModal';
import { ReferralTable } from '../../components/ReferralTable';
import { AppointmentModal } from '../../components/AppointmentModal';
import { AppointmentTable } from '../../components/AppointmentTable';
import { ImmunisationsTable } from '../../components/ImmunisationsTable';
import { ImmunisationModal } from '../../components/ImmunisationModal';
import { EditAdministeredVaccineModal } from '../../components/EditAdministeredVaccineModal';
import { ImmunisationCertificateModal } from '../../components/ImmunisationCertificateModal';
import { Button } from '../../components/Button';
import { connectRoutedModal } from '../../components/Modal';
import { PatientEncounterSummary } from './components/PatientEncounterSummary';
import { DataFetchingSurveyResponsesTable } from '../../components/SurveyResponsesTable';

import { PatientDetailsForm } from '../../forms/PatientDetailsForm';
import { reloadPatient } from '../../store/patient';

import { useEncounter } from '../../contexts/Encounter';

const AppointmentPane = React.memo(({ patient, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <AppointmentModal
        open={modalOpen}
        patientId={patient.id}
        onClose={() => setModalOpen(false)}
      />
      <AppointmentTable appointments={patient.appointments} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New appointment
        </Button>
      </ContentPane>
    </div>
  );
});

const ReferralPane = connect(null, dispatch => ({
  onNavigateToReferrals: () => dispatch(push('/referrals')),
}))(
  React.memo(({ onNavigateToReferrals, patient }) => (
    <div>
      <ReferralTable patientId={patient.id} />
      <ContentPane>
        <Button onClick={onNavigateToReferrals} variant="contained" color="primary">
          New referral
        </Button>
      </ContentPane>
    </div>
  )),
);

const ButtonSpacer = styled.div`
  display: inline;
  margin-right: 10px;
`;

const ImmunisationsPane = React.memo(({ patient, readonly }) => {
  const [isAdministerModalOpen, setIsAdministerModalOpen] = React.useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = React.useState(false);
  const [isEditAdministeredModalOpen, setIsEditAdministeredModalOpen] = React.useState(false);
  const [vaccineRecordId, setVaccineRecordId] = React.useState();
  const onOpenEditModal = useCallback(
    async id => {
      setIsEditAdministeredModalOpen(true);
      setVaccineRecordId(id);
    },
    [patient],
  );

  return (
    <div>
      <ImmunisationModal
        open={isAdministerModalOpen}
        patientId={patient.id}
        onClose={() => setIsAdministerModalOpen(false)}
      />
      <EditAdministeredVaccineModal
        open={isEditAdministeredModalOpen}
        patientId={patient.id}
        vaccineRecordId={vaccineRecordId}
        onClose={() => setIsEditAdministeredModalOpen(false)}
      />
      <ImmunisationsTable patient={patient} onItemClick={id => onOpenEditModal(id)} />
      <ImmunisationCertificateModal
        open={isCertificateModalOpen}
        patient={patient}
        onClose={() => setIsCertificateModalOpen(false)}
      />
      <ContentPane>
        <Button
          onClick={() => setIsAdministerModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          Give Vaccine
        </Button>
        <ButtonSpacer />
        <Button onClick={() => setIsCertificateModalOpen(true)} variant="outlined" color="primary">
          View Certificate
        </Button>
      </ContentPane>
    </div>
  );
});

const RoutedEncounterModal = connectRoutedModal('/patients/view', 'checkin')(EncounterModal);
const RoutedTriageModal = connectRoutedModal('/patients/view', 'triage')(TriageModal);

const HistoryPane = connect(
  state => ({
    currentEncounter: state.patient.currentEncounter,
    patient: state.patient,
  }),
  dispatch => ({
    onOpenCheckin: () => dispatch(push('/patients/view/checkin')),
    onOpenTriage: () => dispatch(push('/patients/view/triage')),
  }),
)(
  React.memo(({ patient, currentEncounter, onOpenCheckin, onOpenTriage, disabled }) => {
    const { encounter, loadEncounter } = useEncounter();
    const onViewEncounter = useCallback(
      async id => {
        await loadEncounter(id, true);
      },
      [encounter],
    );
    return (
      <div>
        <PatientEncounterSummary
          encounter={currentEncounter}
          viewEncounter={onViewEncounter}
          openCheckin={onOpenCheckin}
          openTriage={onOpenTriage}
          disabled={disabled}
        />
        <PatientHistory patient={patient} onItemClick={onViewEncounter} />
      </div>
    );
  }),
);

const ConnectedPatientDetailsForm = connectApi((api, dispatch, { patient }) => ({
  onSubmit: async data => {
    await api.put(`patient/${patient.id}`, data);
    dispatch(reloadPatient(patient.id));
  },
}))(
  React.memo(props => (
    <ContentPane>
      <PatientDetailsForm {...props} />
    </ContentPane>
  )),
);

const ProgramsPane = connect(null, dispatch => ({
  onNavigateToPrograms: () => dispatch(push('/programs')),
}))(
  React.memo(({ onNavigateToPrograms, patient }) => (
    <div>
      <DataFetchingSurveyResponsesTable patientId={patient.id} />
      <ContentPane>
        <Button onClick={onNavigateToPrograms} variant="contained" color="primary">
          New survey
        </Button>
      </ContentPane>
    </div>
  )),
);

const TABS = [
  {
    label: 'History',
    key: 'history',
    icon: 'fa fa-calendar-day',
    render: () => <HistoryPane />,
  },
  {
    label: 'Details',
    key: 'details',
    icon: 'fa fa-info-circle',
    render: props => <ConnectedPatientDetailsForm {...props} />,
  },
  {
    label: 'Appointments',
    key: 'appointments',
    icon: 'fa fa-user-md',
    // render: props => <AppointmentPane {...props} />,
  },
  {
    label: 'Referrals',
    key: 'Referrals',
    icon: 'fa fa-hospital',
    render: props => <ReferralPane {...props} />,
  },
  {
    label: 'Programs',
    key: 'Programs',
    icon: 'fa fa-hospital',
    render: props => <ProgramsPane {...props} />,
  },
  {
    label: 'Documents',
    key: 'documents',
    icon: 'fa fa-file-medical-alt',
  },
  {
    label: 'Immunisation',
    key: 'a',
    icon: 'fa fa-syringe',
    render: props => <ImmunisationsPane {...props} />,
  },
];

export const DumbPatientView = React.memo(({ patient, loading }) => {
  const [currentTab, setCurrentTab] = React.useState('history');
  const disabled = !!patient.death;

  if (loading) return <LoadingIndicator />;
  return (
    <React.Fragment>
      <PatientAlert alerts={patient.alerts} />
      <TwoColumnDisplay>
        <PatientInfoPane patient={patient} disabled={disabled} />
        <TabDisplay
          tabs={TABS}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          patient={patient}
          disabled={disabled}
        />
      </TwoColumnDisplay>
      <RoutedEncounterModal patientId={patient.id} referrals={patient.referrals} />
      <RoutedTriageModal patient={patient} />
    </React.Fragment>
  );
});

export const PatientView = connect(state => ({
  loading: state.patient.loading,
  patient: state.patient,
}))(DumbPatientView);
