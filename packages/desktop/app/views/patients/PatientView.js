import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { TabDisplay } from '../../components/TabDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { EncounterModal } from '../../components/EncounterModal';
import { TriageModal } from '../../components/TriageModal';
import { connectRoutedModal } from '../../components/Modal';
import { useLocalisation } from '../../contexts/Localisation';
import { useApi } from '../../api';

import {
  HistoryPane,
  ImmunisationsPane,
  PatientMedicationPane,
  DocumentsPane,
  PatientProgramsPane,
  ReferralPane,
  InvoicesPane,
  PatientDetailsPane,
} from './panes';
import { Colors } from '../../constants';
import { NAVIGATION_CONTAINER_HEIGHT } from '../../components/PatientNavigation';

const getConnectRoutedModal = ({ category, patientId }, suffix) =>
  connectRoutedModal(`/patients/${category}/${patientId}`, suffix);

const StyledDisplayTabs = styled(TabDisplay)`
  overflow: initial;
  .MuiTabs-root {
    z-index: 9;
    position: sticky;
    top: ${NAVIGATION_CONTAINER_HEIGHT};
    border-bottom: 1px solid ${Colors.softOutline};
  }
`;

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
    render: props => <PatientDetailsPane {...props} />,
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
      <PatientProgramsPane endpoint={`patient/${patient.id}/programResponses`} {...props} />
    ),
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

export const PatientView = () => {
  const params = useParams();
  const { getLocalisation } = useLocalisation();
  const patient = useSelector(state => state.patient);
  const [currentTab, setCurrentTab] = React.useState('history');
  const disabled = !!patient.death;
  const api = useApi();
  const { data: additionalData, isLoading } = useQuery(['additionalData', patient.id], () =>
    api.get(`patient/${patient.id}/additionalData`),
  );

  const RoutedEncounterModal = useMemo(() => getConnectRoutedModal(params, 'checkin'), [params])(
    EncounterModal,
  );

  const RoutedTriageModal = useMemo(() => getConnectRoutedModal(params, 'triage'), [params])(
    TriageModal,
  );

  if (patient.loading || isLoading) return <LoadingIndicator />;

  const visibleTabs = TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));

  return (
    <>
      <PatientAlert alerts={patient.alerts} />
      <StyledDisplayTabs
        tabs={visibleTabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        patient={patient}
        additionalData={additionalData}
        disabled={disabled}
      />
      <RoutedEncounterModal
        patientId={patient.id}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
        referrals={patient.referrals}
      />
      <RoutedTriageModal patient={patient} />
    </>
  );
};
