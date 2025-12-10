import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router';

import { TabDisplay } from '../../components/TabDisplay';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { useApi } from '../../api';
import { reloadPatient } from '../../store/patient';
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
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { invalidatePatientDataQueries } from '../../utils';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useSyncState } from '../../contexts/SyncState';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { NAVIGATION_CONTAINER_HEIGHT } from '../../features/Breadcrumbs';

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
    label: (
      <TranslatedText
        stringId="patient.tab.summary"
        fallback="Summary"
        data-testid="translatedtext-cj83"
      />
    ),
    key: PATIENT_TABS.SUMMARY,
    icon: 'fa fa-user',
    render: props => <SummaryPane {...props} data-testid="summarypane-ejii" />,
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.details"
        fallback="Details"
        data-testid="translatedtext-9lfl"
      />
    ),
    key: PATIENT_TABS.DETAILS,
    icon: 'fa fa-info-circle',
    render: props => <PatientDetailsPane {...props} data-testid="patientdetailspane-3c2h" />,
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.results"
        fallback="Results"
        data-testid="translatedtext-4g38"
      />
    ),
    key: PATIENT_TABS.RESULTS,
    icon: 'fa fa-file-alt',
    render: props => <PatientResultsPane {...props} data-testid="patientresultspane-v8tp" />,
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.referrals"
        fallback="Referrals"
        data-testid="translatedtext-glkz"
      />
    ),
    key: PATIENT_TABS.REFERRALS,
    icon: 'fa fa-hospital',
    render: props => <ReferralPane {...props} data-testid="referralpane-gsjk" />,
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.forms"
        fallback="Forms"
        data-testid="translatedtext-xgx4"
      />
    ),
    key: PATIENT_TABS.PROGRAMS,
    icon: 'fa fa-hospital',
    render: props => (
      <PatientProgramsPane
        endpoint={`patient/${props.patient.id}/programResponses`}
        {...props}
        data-testid="patientprogramspane-s46b"
      />
    ),
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.documents"
        fallback="Documents"
        data-testid="translatedtext-2jxw"
      />
    ),
    key: PATIENT_TABS.DOCUMENTS,
    icon: 'fa fa-file-medical-alt',
    render: props => <DocumentsPane {...props} data-testid="documentspane-22r0" />,
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.vaccines"
        fallback="Vaccines"
        data-testid="translatedtext-7h6h"
      />
    ),
    key: PATIENT_TABS.VACCINES,
    icon: 'fa fa-syringe',
    render: props => <VaccinesPane {...props} data-testid="vaccinespane-pv8u" />,
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.medication"
        fallback="Medication"
        data-testid="translatedtext-5ma2"
      />
    ),
    key: PATIENT_TABS.MEDICATION,
    icon: 'fa fa-medkit',
    render: props => <PatientMedicationPane {...props} data-testid="patientmedicationpane-9h95" />,
    condition: ability => ability.can('list', 'Medication'),
  },
  {
    label: (
      <TranslatedText
        stringId="patient.tab.invoices"
        fallback="Invoices"
        data-testid="translatedtext-3348"
      />
    ),
    key: PATIENT_TABS.INVOICES,
    icon: 'fa fa-cash-register',
    render: props => <InvoicesPane {...props} data-testid="invoicespane-ihh3" />,
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
  const dispatch = useDispatch();
  const { patientId } = useParams();
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
  const {
    data: additionalData,
    isLoading: isLoadingAdditionalData,
  } = usePatientAdditionalDataQuery(patient.id);
  const { data: birthData, isLoading: isLoadingBirthData } = useQuery(
    ['birthData', patient.id],
    () => api.get(`patient/${patient.id}/birthData`),
  );

  useEffect(() => {
    if (patientId && (!patient?.id || patient?.id !== patientId)) {
      dispatch(reloadPatient(patientId));
    }
  }, [dispatch, patientId, patient?.id]);

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
    if (patient?.id) {
      api.post(`user/recently-viewed-patients/${patient.id}`);
    }
  }, [api, patient?.id]);

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
    return <LoadingIndicator data-testid="patient-view-loading" />;
  }

  return (
    <>
      <PatientAlert alerts={patient.alerts} data-testid="patientalert-5sl7" />
      <StyledDisplayTabs
        tabs={visibleTabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        patient={patient}
        additionalData={additionalData}
        birthData={birthData}
        disabled={disabled}
        data-testid="styleddisplaytabs-6gds"
      />
    </>
  );
};
