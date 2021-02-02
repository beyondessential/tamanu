import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

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
import { Button } from '../../components/Button';
import { connectRoutedModal } from '../../components/Modal';
import { PatientEncounterSummary } from './components/PatientEncounterSummary';
import { DataFetchingSurveyResponsesTable } from '../../components/SurveyResponsesTable';

import { PatientDetailsForm } from '../../forms/PatientDetailsForm';
import { Suggester } from '../../utils/suggester';

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

const ReferralPane = React.memo(({ patient, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <ReferralModal open={modalOpen} patientId={patient.id} onClose={() => setModalOpen(false)} />
      <ReferralTable patientId={patient.id} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New referral
        </Button>
      </ContentPane>
    </div>
  );
});

const ImmunisationsPane = React.memo(({ patient, readonly }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div>
      <ImmunisationModal
        open={modalOpen}
        patientId={patient.id}
        onClose={() => setModalOpen(false)}
      />
      <ImmunisationsTable patient={patient} />
      <ContentPane>
        <Button
          onClick={() => setModalOpen(true)}
          variant="contained"
          color="primary"
          disabled={readonly}
        >
          New immunisation
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
    patientId: state.patient.id,
  }),
  dispatch => ({
    onViewEncounter: () => dispatch(push(`/patients/encounter/`)),
    onOpenCheckin: () => dispatch(push('/patients/view/checkin')),
    onOpenTriage: () => dispatch(push('/patients/view/triage')),
  }),
)(
  React.memo(
    ({ patientId, currentEncounter, onViewEncounter, onOpenCheckin, onOpenTriage, disabled }) => {
      const { encounter, setEncounterId } = useEncounter();
      const viewEncounter = useCallback(
        item => {
          setEncounterId(item.id);
          onViewEncounter();
        },
        [encounter],
      );
      return (
        <div>
          <PatientEncounterSummary
            encounter={currentEncounter}
            viewEncounter={viewEncounter}
            openCheckin={onOpenCheckin}
            openTriage={onOpenTriage}
            disabled={disabled}
          />
          <PatientHistory patientId={patientId} onItemClick={viewEncounter} />
        </div>
      );
    },
  ),
);

const ConnectedPatientDetailsForm = connectApi((api, dispatch, { patient }) => ({
  onSubmit: async data => {
    await api.put(`patient/${patient.id}`, data);
    dispatch(reloadPatient(patient.id));
  },
  patientSuggester: new Suggester(api, 'patient', ({ id, firstName, lastName }) => ({
    value: id,
    label: `${firstName} ${lastName}`,
  })),
  facilitySuggester: new Suggester(api, 'facility'),
  villageSuggester: new Suggester(api, 'village'),
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
    label: 'Immunisations',
    key: 'a',
    icon: 'fa fa-syringe',
    render: props => <ImmunisationsPane {...props} />,
  },
];

export const DumbPatientView = React.memo(({ patient, loading }) => {
  if (loading) return <LoadingIndicator />;

  const [currentTab, setCurrentTab] = React.useState('history');
  const disabled = !!patient.death;

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
  encounter: state.encounter,
}))(DumbPatientView);
