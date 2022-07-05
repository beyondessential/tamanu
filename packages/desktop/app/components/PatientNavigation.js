import React from 'react';
import { useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import { Colors } from '../constants';
import { PATIENT_PATHS, PATIENT_TAB_VALUES } from '../constants/patientNavigation';
import { useLocalisation } from '../contexts/Localisation';
import { usePatientTabs } from '../contexts/PatientTabs';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { BackButton } from './Button';
import { PatientBreadcrumbs } from './PatientBreadcrumbs';
import { Tabs } from './Tabs';

const StickyContainer = styled.div`
  position: sticky;
  top: 0px;
  z-index: 9;
  border-bottom: 1px solid ${Colors.softOutline};
`;

const PatientNavigationContainer = styled.div`
  width: 100%;
  background: ${Colors.white};
  display: flex;
  height: 50px;
  align-items: center;
  padding-left: 30px;
  padding-right: 30px;
  border-bottom: 1px solid ${Colors.softOutline};
`;

const VerticalDivider = styled.div`
  margin-left: 30px;
  margin-right: 30px;
  border-left: 1px solid ${Colors.softOutline};
  height: 100%;
`;

export const PATIENT_TABS = [
  {
    label: 'History',
    value: PATIENT_TAB_VALUES.HISTORY,
    icon: 'fa fa-calendar-day',
  },
  {
    label: 'Details',
    value: PATIENT_TAB_VALUES.DETAILS,
    icon: 'fa fa-info-circle',
  },
  {
    label: 'Referrals',
    value: PATIENT_TAB_VALUES.REFERRALS,
    icon: 'fa fa-hospital',
  },
  {
    label: 'Programs',
    value: PATIENT_TAB_VALUES.PROGRAMS,
    icon: 'fa fa-hospital',
  },
  {
    label: 'Documents',
    value: PATIENT_TAB_VALUES.DOCUMENT,
    icon: 'fa fa-file-medical-alt',
  },
  {
    label: 'Immunisation',
    value: PATIENT_TAB_VALUES.IMMUNISATION,
    icon: 'fa fa-syringe',
  },
  {
    label: 'Medication',
    value: PATIENT_TAB_VALUES.MEDICATION,
    icon: 'fa fa-medkit',
  },
  {
    label: 'Invoices',
    value: PATIENT_TAB_VALUES.INVOICES,
    icon: 'fa fa-cash-register',
    condition: getLocalisation => getLocalisation('features.enableInvoicing'),
  },
];

const PatientTabs = () => {
  const { getLocalisation } = useLocalisation();
  const { currentTab, setCurrentTab } = usePatientTabs();
  const visibleTabs = PATIENT_TABS.filter(tab => !tab.condition || tab.condition(getLocalisation));
  return <Tabs tabs={visibleTabs} value={currentTab} onChange={setCurrentTab} />;
};

export const PatientNavigation = ({ patientRoutes }) => {
  const patientMatch = useRouteMatch(PATIENT_PATHS.PATIENT);
  const { navigateBack } = usePatientNavigation();
  return (
    <StickyContainer>
      <PatientNavigationContainer>
        <BackButton onClick={navigateBack} />
        <VerticalDivider />
        <PatientBreadcrumbs patientRoutes={patientRoutes} />
      </PatientNavigationContainer>
      {patientMatch.isExact && <PatientTabs />}
    </StickyContainer>
  );
};
