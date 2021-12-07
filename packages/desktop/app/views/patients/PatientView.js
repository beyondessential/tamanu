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
