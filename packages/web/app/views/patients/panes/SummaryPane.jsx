import React, { useCallback, useState } from 'react';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { useEncounter } from '../../../contexts/Encounter';
import { Box } from '@material-ui/core';

import { CompactContentPane as ContentPane } from '../../../components';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';
import { EncounterModal } from '../../../components/EncounterModal';
import { LocationBookingsTable } from '../../../components/Appointments/LocationBookingsTable';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';
import { OutpatientAppointmentsTable } from '../../../components/Appointments/OutpatientAppointmentsTable';

export const SummaryPane = React.memo(({ patient, additionalData, disabled }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { navigateToEncounter } = usePatientNavigation();
  const { loadEncounter } = useEncounter();
  const { ability } = useAuth();
  const { getSetting } = useSettings();

  const showLocationBookingsSetting = getSetting('layouts.patientView.showLocationBookings');
  const showOutpatientAppointmentsSetting = getSetting(
    'layouts.patientView.showOutpatientAppointments',
  );
  const canViewAppointments = ability.can('listOrRead', 'Appointment');

  const showLocationBookings = showLocationBookingsSetting && canViewAppointments;
  const showOutpatientAppointments = showOutpatientAppointmentsSetting && canViewAppointments;

  const onViewEncounter = useCallback(
    id => {
      (async () => {
        await loadEncounter(id);
        navigateToEncounter(id);
      })();
    },
    [loadEncounter, navigateToEncounter],
  );

  const onCloseModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <Box height={5} />
      <ContentPane data-testid='contentpane-3jxx'>
        <PatientEncounterSummary
          viewEncounter={onViewEncounter}
          openCheckin={() => setModalOpen(true)}
          patient={patient}
          disabled={disabled}
          data-testid='patientencountersummary-z703' />
      </ContentPane>
      {showOutpatientAppointments && (
        <ContentPane data-testid='contentpane-dvc2'>
          <OutpatientAppointmentsTable patient={patient} data-testid='outpatientappointmentstable-27ad' />
        </ContentPane>
      )}
      {showLocationBookings && (
        <ContentPane data-testid='contentpane-epfl'>
          <LocationBookingsTable patient={patient} data-testid='locationbookingstable-v4jv' />
        </ContentPane>
      )}
      <ContentPane data-testid='contentpane-n51k'>
        <PatientHistory
          patient={patient}
          onItemClick={onViewEncounter}
          data-testid='patienthistory-yw6n' />
      </ContentPane>
      <EncounterModal
        open={isModalOpen}
        onClose={onCloseModal}
        patient={patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
        data-testid='encountermodal-pnpe' />
    </>
  );
});
