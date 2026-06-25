import React, { useEffect, useMemo } from 'react';
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
import { useSyncedTabSearchParam } from '../../utils/useSyncedTabSearchParam';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { invalidatePatientDataQueries } from '../../utils';
import { useSyncState } from '../../contexts/SyncState';
import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';
import { usePatientAdditionalDataQuery, usePatientInsurancePlansQuery } from '../../api/queries';
import { NAVIGATION_CONTAINER_HEIGHT } from '../../features/Breadcrumbs';

const StyledDisplayTabs = styled(TabDisplay)`
  border-bottom: 1px solid ${Colors.softOutline};
  overflow: initial;
  position: sticky;
  top: ${NAVIGATION_CONTAINER_HEIGHT};
  z-index: 9;
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
    condition: (ability, getSetting) =>
      getSetting('features.invoicing.enabled') && ability.can('list', 'Invoice'),
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
      patientTabSettings?.[tab.key]?.hidden !== true &&
      (!tab.condition || tab.condition(ability, getSetting)),
  ).sort((firstTab, secondTab) => tabCompare({ firstTab, secondTab, patientTabSettings }));
};

export const PatientView = () => {
  const dispatch = useDispatch();
  const { patientId } = useParams();
  const queryClient = useQueryClient();
  const patient = useSelector(state => state.patient);
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
  const {
    data: insurancePlans = [],
    isLoading: isLoadingInsurancePlans,
  } = usePatientInsurancePlansQuery({ patientId: patient?.id });

  const visibleTabs = usePatientTabs();
  const visibleTabKeys = useMemo(() => visibleTabs.map(tab => tab.key), [visibleTabs]);
  const fallbackPatientTab = visibleTabs[0]?.key ?? PATIENT_TABS.SUMMARY;
  const { currentTab, onTabSelect } = useSyncedTabSearchParam(visibleTabKeys, fallbackPatientTab);

  useEffect(() => {
    if (patientId && (!patient?.id || patient?.id !== patientId)) {
      dispatch(reloadPatient(patientId));
    }
  }, [dispatch, patientId, patient?.id]);

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

  if (patient.loading || isLoadingAdditionalData || isLoadingBirthData || isLoadingInsurancePlans) {
    return <LoadingIndicator data-testid="patient-view-loading" />;
  }

  return (
    <>
      <PatientAlert alerts={patient.alerts} data-testid="patientalert-5sl7" />
      <StyledDisplayTabs
        tabs={visibleTabs}
        currentTab={currentTab}
        onTabSelect={onTabSelect}
        patient={patient}
        additionalData={additionalData}
        birthData={birthData}
        insurancePlans={insurancePlans}
        disabled={disabled}
        data-testid="styleddisplaytabs-6gds"
      />
    </>
  );
};
