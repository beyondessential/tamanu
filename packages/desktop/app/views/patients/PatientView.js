import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { TabDisplay } from '../../components/TabDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { useLocalisation } from '../../contexts/Localisation';
import { useApi } from '../../api';
import {
  HistoryPane,
  VaccinesPane,
  PatientMedicationPane,
  DocumentsPane,
  PatientProgramsPane,
  ReferralPane,
  InvoicesPane,
  PatientDetailsPane,
  PatientResultsPane,
} from './panes';
import { Colors } from '../../constants';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { NAVIGATION_CONTAINER_HEIGHT } from '../../components/PatientNavigation';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { PatientSearchParametersProvider } from '../../contexts/PatientViewSearchParameters';
import { TranslatedText } from '../../components/Translation/TranslatedText';

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
    label: <TranslatedText stringId="patient.tabs.history" fallback="History" />,
    key: PATIENT_TABS.HISTORY,
    icon: 'fa fa-calendar-day',
    render: props => <HistoryPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.details" fallback="Details" />,
    key: PATIENT_TABS.DETAILS,
    icon: 'fa fa-info-circle',
    render: props => <PatientDetailsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.results" fallback="Results" />,
    key: PATIENT_TABS.RESULTS,
    icon: 'fa fa-file-alt',
    render: props => <PatientResultsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.referrals" fallback="Referrals" />,
    key: PATIENT_TABS.REFERRALS,
    icon: 'fa fa-hospital',
    render: props => <ReferralPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.programs" fallback="Programs" />,
    key: PATIENT_TABS.PROGRAMS,
    icon: 'fa fa-hospital',
    render: ({ patient, ...props }) => (
      <PatientProgramsPane endpoint={`patient/${patient.id}/programResponses`} {...props} />
    ),
  },
  {
    label: <TranslatedText stringId="patient.tabs.documents" fallback="Documents" />,
    key: PATIENT_TABS.DOCUMENTS,
    icon: 'fa fa-file-medical-alt',
    render: props => <DocumentsPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.vaccines" fallback="Vaccines" />,
    key: PATIENT_TABS.VACCINES,
    icon: 'fa fa-syringe',
    render: props => <VaccinesPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.medication" fallback="Medication" />,
    key: PATIENT_TABS.MEDICATION,
    icon: 'fa fa-medkit',
    render: props => <PatientMedicationPane {...props} />,
  },
  {
    label: <TranslatedText stringId="patient.tabs.invoices" fallback="Invoices" />,
    key: PATIENT_TABS.INVOICES,
    icon: 'fa fa-cash-register',
    render: props => <InvoicesPane {...props} />,
  },
];

export const PatientView = () => {
  const { getLocalisation } = useLocalisation();
  const query = useUrlSearchParams();
  const patient = useSelector(state => state.patient);
  const [currentTab, setCurrentTab] = useState(query.get('tab') || PATIENT_TABS.HISTORY);
  const disabled = !!patient.death;
  const api = useApi();
  const { data: additionalData, isLoading: isLoadingAdditionalData } = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${patient.id}/additionalData`),
  );
  const { data: birthData, isLoading: isLoadingBirthData } = useQuery(
    ['birthData', patient.id],
    () => api.get(`patient/${patient.id}/birthData`),
  );

  useEffect(() => {
    api.post(`user/recently-viewed-patients/${patient.id}`);
  }, [api, patient.id]);

  if (patient.loading || isLoadingAdditionalData || isLoadingBirthData) {
    return <LoadingIndicator />;
  }

  const visibleTabs = TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));

  return (
    <PatientSearchParametersProvider>
      <PatientAlert alerts={patient.alerts} />
      <StyledDisplayTabs
        tabs={visibleTabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        patient={patient}
        additionalData={additionalData}
        birthData={birthData}
        disabled={disabled}
      />
    </PatientSearchParametersProvider>
  );
};
