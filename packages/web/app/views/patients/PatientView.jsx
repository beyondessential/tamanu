import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { TabDisplay } from '../../components/TabDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { useApi } from '../../api';
import {
  DocumentsPane,
  SummaryPane,
  InvoicesPane,
  PatientDetailsPane,
  PatientMedicationPane,
  PatientProgramsPane,
  PatientResultsPane,
  ReferralPane,
  VaccinesPane,
} from './panes';
import { Colors } from '../../constants';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { NAVIGATION_CONTAINER_HEIGHT } from '../../components/PatientNavigation';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { PatientSearchParametersProvider } from '../../contexts/PatientViewSearchParameters';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { invalidatePatientDataQueries } from '../../utils';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useSyncState } from '../../contexts/SyncState';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';

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
    label: <TranslatedText
      stringId="patient.tab.summary"
      fallback="Summary"
      data-test-id='translatedtext-w8k9' />,
    key: PATIENT_TABS.SUMMARY,
    icon: 'fa fa-user',
    render: props => <SummaryPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.details"
      fallback="Details"
      data-test-id='translatedtext-2d30' />,
    key: PATIENT_TABS.DETAILS,
    icon: 'fa fa-info-circle',
    render: props => <PatientDetailsPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.results"
      fallback="Results"
      data-test-id='translatedtext-m2tq' />,
    key: PATIENT_TABS.RESULTS,
    icon: 'fa fa-file-alt',
    render: props => <PatientResultsPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.referrals"
      fallback="Referrals"
      data-test-id='translatedtext-14j2' />,
    key: PATIENT_TABS.REFERRALS,
    icon: 'fa fa-hospital',
    render: props => <ReferralPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.forms"
      fallback="Forms"
      data-test-id='translatedtext-wcu2' />,
    key: PATIENT_TABS.PROGRAMS,
    icon: 'fa fa-hospital',
    render: props => (
      <PatientProgramsPane endpoint={`patient/${props.patient.id}/programResponses`} {...props} />
    ),
  },
  {
    label: <TranslatedText
      stringId="patient.tab.documents"
      fallback="Documents"
      data-test-id='translatedtext-gjuy' />,
    key: PATIENT_TABS.DOCUMENTS,
    icon: 'fa fa-file-medical-alt',
    render: props => <DocumentsPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.vaccines"
      fallback="Vaccines"
      data-test-id='translatedtext-dy1v' />,
    key: PATIENT_TABS.VACCINES,
    icon: 'fa fa-syringe',
    render: props => <VaccinesPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.medication"
      fallback="Medication"
      data-test-id='translatedtext-uzfv' />,
    key: PATIENT_TABS.MEDICATION,
    icon: 'fa fa-medkit',
    render: props => <PatientMedicationPane {...props} />,
  },
  {
    label: <TranslatedText
      stringId="patient.tab.invoices"
      fallback="Invoices"
      data-test-id='translatedtext-3hd9' />,
    key: PATIENT_TABS.INVOICES,
    icon: 'fa fa-cash-register',
    render: props => <InvoicesPane {...props} />,
    condition: ability => ability.can('list', 'Invoice'),
  },
];

const tabCompare = ({ firstTab, secondTab, patientTabSettings }) => {
  const firstTabSortPriority = patientTabSettings?.[firstTab.key]?.sortPriority || 0;
  const secondTabSortPriority = patientTabSettings?.[secondTab.key]?.sortPriority || 0;
  return firstTabSortPriority - secondTabSortPriority;
};

const usePatientTabs = () => {
  const { ability } = useAuth();
  const { getSetting } = useSettings();
  const patientTabSettings = getSetting('layouts.patientTabs');
  return TABS.filter(
    tab =>
      patientTabSettings?.[tab.key]?.hidden !== true && (!tab.condition || tab.condition(ability)),
  ).sort((firstTab, secondTab) => tabCompare({ firstTab, secondTab, patientTabSettings }));
};

export const PatientView = () => {
  const queryClient = useQueryClient();
  const { navigateToPatient } = usePatientNavigation();
  const query = useUrlSearchParams();
  const patient = useSelector(state => state.patient);
  const queryTab = query.get('tab');
  const [currentTab, setCurrentTab] = useState(queryTab || PATIENT_TABS.SUMMARY);
  const disabled = !!patient.dateOfDeath;
  const api = useApi();
  const syncState = useSyncState();
  const isSyncing = syncState.isPatientSyncing(patient.id);
  const { data: additionalData, isLoading: isLoadingAdditionalData } = useQuery(
    ['additionalData', patient.id],
    () => api.get(`patient/${patient.id}/additionalData`),
  );
  const { data: birthData, isLoading: isLoadingBirthData } = useQuery(
    ['birthData', patient.id],
    () => api.get(`patient/${patient.id}/birthData`),
  );

  useEffect(() => {
    if (queryTab && queryTab !== currentTab) {
      setCurrentTab(queryTab);
      // remove the query parameter 'tab' after the tab has already been selected
      navigateToPatient(patient.id);
    }

    // only fire when queryTab is changed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTab]);

  useEffect(() => {
    api.post(`user/recently-viewed-patients/${patient.id}`);
  }, [api, patient.id]);

  useEffect(() => {
    if (!isSyncing) {
      // invalidate the cache of patient data queries to reload the patient data
      invalidatePatientDataQueries(queryClient, patient.id);
    }

    // invalidate queries only when syncing is done (changed from true to false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSyncing]);

  const visibleTabs = usePatientTabs();

  if (patient.loading || isLoadingAdditionalData || isLoadingBirthData) {
    return <LoadingIndicator />;
  }

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
