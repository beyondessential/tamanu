import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useParams } from 'react-router-dom';
import { PanoramaFishEyeOutlined } from '@material-ui/icons';
import { TabDisplay } from '../../components/TabDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
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
      <ProgramsPane endpoint={`patient/${patient.Id}/programResponses`} {...props} />
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

const getConnectRoutedModal = ({ category, patientId }, suffix) =>
  connectRoutedModal(`/patients/${category}/${patientId}`, suffix);

export const PatientView = () => {
  const params = useParams();
  const { getLocalisation } = useLocalisation();
  const patient = useSelector(state => state.patient);
  const loading = useSelector(state => state.loading);
  const [currentTab, setCurrentTab] = React.useState('history');
  const disabled = !!patient.death;

  const RoutedEncounterModal = useMemo(() => getConnectRoutedModal(params, 'checkin'), [params])(
    EncounterModal,
  );

  const RoutedTriageModal = useMemo(() => getConnectRoutedModal(params, 'triage'), [params])(
    TriageModal,
  );

  if (loading) return <LoadingIndicator />;

  const visibleTabs = TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));

  return (
    <>
      <PatientAlert alerts={patient.alerts} />
      <TabDisplay
        tabs={visibleTabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        patient={patient}
        disabled={disabled}
      />
      <RoutedEncounterModal
        patientId={patient.id}
        patientBillingTypeId={patient.additionalData?.patientBillingTypeId}
        referrals={patient.referrals}
      />
      <RoutedTriageModal patient={patient} />
    </>
  );
};
