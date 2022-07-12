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
import { useLocalisation } from '../../contexts/Localisation';

import {
  ConnectedPatientDetailsForm,
  HistoryPane,
  ImmunisationsPane,
  PatientMedicationPane,
  DocumentsPane,
  ProgramsPane,
  ReferralPane,
  InvoicesPane,
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
    label: 'Referrals',
    key: 'Referrals',
    icon: 'fa fa-hospital',
    render: props => <ReferralPane {...props} />,
  },
  {
    label: 'Programs',
    key: 'Programs',
    icon: 'fa fa-hospital',
    render: ({ patient, ...props }) => (
      <ProgramsPane endpoint={`patient/${patient.id}/programResponses`} {...props} />
    ),
  },
  {
    label: 'Documents',
    key: 'documents',
    icon: 'fa fa-file-medical-alt',
    render: props => <DocumentsPane {...props} showSearchBar />,
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
    render: props => <PatientMedicationPane {...props} />,
  },
  {
    label: 'Invoices',
    key: 'invoices',
    icon: 'fa fa-cash-register',
    render: props => <InvoicesPane {...props} />,
    condition: getLocalisation => getLocalisation('features.enableInvoicing'),
  },
];

export const DumbPatientView = React.memo(({ patient, loading }) => {
  const { getLocalisation } = useLocalisation();
  const [currentTab, setCurrentTab] = React.useState('history');
  const disabled = !!patient.death;

  if (loading) return <LoadingIndicator />;

  const visibleTabs = TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));

  return (
    <>
      <PatientAlert alerts={patient.alerts} />
      <TwoColumnDisplay>
        <PatientInfoPane patient={patient} disabled={disabled} />
        <TabDisplay
          tabs={visibleTabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          patient={patient}
          disabled={disabled}
        />
      </TwoColumnDisplay>
      <RoutedEncounterModal
        patientId={patient.id}
        patientBillingTypeId={patient.additionalData?.patientBillingTypeId}
        referrals={patient.referrals}
      />
      <RoutedTriageModal patient={patient} />
    </>
  );
});

export const PatientView = connect(state => ({
  loading: state.patient.loading,
  patient: state.patient,
}))(DumbPatientView);
