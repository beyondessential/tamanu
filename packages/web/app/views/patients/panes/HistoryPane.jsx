import React, { useCallback, useState } from 'react';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { useEncounter } from '../../../contexts/Encounter';

import { ContentPane } from '../../../components';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';
import { EncounterModal } from '../../../components/EncounterModal';
import { LocationBookingsTable } from '../../../components/Appointments/LocationBookingsTable';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';

export const HistoryPane = React.memo(({ patient, additionalData, disabled }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { navigateToEncounter } = usePatientNavigation();
  const { loadEncounter } = useEncounter();
  const { ability } = useAuth();
  const { getSetting } = useSettings();

  const showLocationBookingsSetting = getSetting('layouts.showLocationBookingsOnPatientView');
  const canListAppointment = ability.can('list', 'Appointment');
  const canReadAppointment = ability.can('read', 'Appointment');
  const showLocationBookings =
    showLocationBookingsSetting && canListAppointment && canReadAppointment;

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
      <ContentPane>
        <PatientEncounterSummary
          viewEncounter={onViewEncounter}
          openCheckin={() => setModalOpen(true)}
          patient={patient}
          disabled={disabled}
        />
      </ContentPane>
      {showLocationBookings && (
        <ContentPane>
          <LocationBookingsTable patient={patient} />
        </ContentPane>
      )}
      <ContentPane>
        <PatientHistory patient={patient} onItemClick={onViewEncounter} />
      </ContentPane>
      <EncounterModal
        open={isModalOpen}
        onClose={onCloseModal}
        patient={patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
      />
      {showLocationBookings && <LocationBookingsTable patient={patient} />}
    </>
  );
});
