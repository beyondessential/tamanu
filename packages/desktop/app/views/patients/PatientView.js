import React from 'react';
import { connect } from 'react-redux';

import { TabDisplay } from '../../components/TabDisplay';
import { TwoColumnDisplay } from '../../components/TwoColumnDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { PatientInfoPane } from '../../components/PatientInfoPane';
import { EncounterModal } from '../../components/EncounterModal';
import { TriageModal } from '../../components/TriageModal';
import { connectRoutedModal } from '../../components/Modal';
import { PatientEncounterSummary } from './components/PatientEncounterSummary';
import { DataFetchingProgramsTable } from '../../components/ProgramResponsesTable';

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

import {
  AppointmentPane,
  ConnectedPatientDetailsForm,
  HistoryPane,
  ImmunisationsPane,
  MedicationsPane,
  DocumentsPane,
  ProgramsPane,
  ReferralPane,
} from './panes';

const RoutedEncounterModal = connectRoutedModal('/patients/view', 'checkin')(EncounterModal);
const RoutedTriageModal = connectRoutedModal('/patients/view', 'triage')(TriageModal);

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
      <DataFetchingProgramsTable patientId={patient.id} />
      <ContentPane>
        <Button onClick={onNavigateToPrograms} variant="contained" color="primary">
          New survey
        </Button>
      </ContentPane>
    </div>
  )),
);

const TABS = [
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
    render: props => <DocumentsPane {...props} />,
  },
  {
    label: 'Immunisation',
    key: 'a',
    icon: 'fa fa-syringe',
    render: props => <ImmunisationsPane {...props} />,
  },
  {
    label: 'Medication',
    key: 'medication',
    icon: 'fa fa-medkit',
    render: props => <MedicationsPane {...props} />,
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
