import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useParams } from 'react-router-dom';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientAlert } from '../../components/PatientAlert';
import { EncounterModal } from '../../components/EncounterModal';
import { TriageModal } from '../../components/TriageModal';
import { connectRoutedModal } from '../../components/Modal';
import { PATIENT_TAB_VALUES } from '../../constants/patientNavigation';
import {
  ConnectedPatientDetailsForm,
  HistoryPane,
  ImmunisationsPane,
  PatientMedicationPane,
  DocumentsPane,
  PatientProgramsPane,
  ReferralPane,
  InvoicesPane,
} from './panes';
import { usePatientTabs } from '../../contexts/PatientTabs';

const TabContent = ({ value, ...props }) => {
  const Content = {
    [PATIENT_TAB_VALUES.HISTORY]: HistoryPane,
    [PATIENT_TAB_VALUES.DETAILS]: ConnectedPatientDetailsForm,
    [PATIENT_TAB_VALUES.REFERRALS]: ReferralPane,
    [PATIENT_TAB_VALUES.PROGRAMS]: PatientProgramsPane,
    [PATIENT_TAB_VALUES.DOCUMENT]: DocumentsPane,
    [PATIENT_TAB_VALUES.IMMUNISATION]: ImmunisationsPane,
    [PATIENT_TAB_VALUES.MEDICATION]: PatientMedicationPane,
    [PATIENT_TAB_VALUES.INVOICES]: InvoicesPane,
  }[value];
  return <Content {...props} />;
};

const getConnectRoutedModal = ({ category, patientId }, suffix) =>
  connectRoutedModal(`/patients/${category}/${patientId}`, suffix);

export const PatientView = () => {
  const { currentTab } = usePatientTabs();
  const params = useParams();
  const patient = useSelector(state => state.patient);
  const loading = useSelector(state => state.loading);
  const disabled = !!patient.death;

  const RoutedEncounterModal = useMemo(() => getConnectRoutedModal(params, 'checkin'), [params])(
    EncounterModal,
  );

  const RoutedTriageModal = useMemo(() => getConnectRoutedModal(params, 'triage'), [params])(
    TriageModal,
  );

  if (loading) return <LoadingIndicator />;

  return (
    <>
      <PatientAlert alerts={patient.alerts} />
      <TabContent value={currentTab} patient={patient} disabled={disabled} />
      <RoutedEncounterModal
        patientId={patient.id}
        patientBillingTypeId={patient.additionalData?.patientBillingTypeId}
        referrals={patient.referrals}
      />
      <RoutedTriageModal patient={patient} />
    </>
  );
};
