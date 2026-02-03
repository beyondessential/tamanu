import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { usePatientNavigation } from '../../../utils/usePatientNavigation';
import { useEncounter } from '../../../contexts/Encounter';
import { Box } from '@material-ui/core';

import {
  BodyText,
  CompactContentPane as ContentPane,
  Modal,
  ModalActionRow,
  TranslatedText,
} from '../../../components';
import { PatientEncounterSummary } from '../components/PatientEncounterSummary';
import { PatientHistory } from '../../../components/PatientHistory';
import { EncounterModal } from '../../../components/EncounterModal';
import { LocationBookingsTable } from '../../../components/Appointments/LocationBookingsTable';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';
import { OutpatientAppointmentsTable } from '../../../components/Appointments/OutpatientAppointmentsTable';
import { usePatientCurrentEncounterQuery } from '../../../api/queries/usePatientCurrentEncounterQuery';
import { useQueryClient } from '@tanstack/react-query';

const StyledBodyText = styled(BodyText)`
  margin: 60px;
  margin-bottom: 78px;
`;

export const ExistingEncounterWarningModal = React.memo(({ open, onClose }) => {
  return (
    <Modal
      title={
        <TranslatedText
          stringId="patient.modal.activeEncounterWarning.title"
          fallback="Cannot create new encounter"
        />
      }
      width="sm"
      open={open}
      onClose={onClose}
      data-testid="formmodal-4oua"
    >
      <StyledBodyText>
        <TranslatedText
          stringId="patient.encounterSummary.activeEncounterWarning"
          fallback="This patient has an active encounter. The active encounter must be discharged before a new encounter can be created."
        />
      </StyledBodyText>
      <ModalActionRow onConfirm={onClose} confirmText="Close" />
    </Modal>
  );
});

export const SummaryPane = React.memo(({ patient, additionalData, disabled }) => {
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const { navigateToEncounter } = usePatientNavigation();
  const { loadEncounter } = useEncounter();
  const { ability } = useAuth();
  const { getSetting } = useSettings();
  const queryClient = useQueryClient();
  const { refetch: refetchCurrentEncounter } = usePatientCurrentEncounterQuery(patient.id);

  const checkForExistingEncounter = useCallback(async () => {
    const { data: encounter } = await refetchCurrentEncounter();
    return !!encounter;
  }, [refetchCurrentEncounter]);

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

  const onCloseCheckInModal = useCallback(() => setIsCheckInModalOpen(false), []);
  const onCloseWarningModal = useCallback(async () => {
    setIsWarningModalOpen(false);
    setIsCheckInModalOpen(false);
    await queryClient.invalidateQueries(['patientCurrentEncounter', patient.id]); // Refresh the current encounter data on close
  }, [queryClient, patient.id]);

  const withExistingEncounterCheck = useCallback(
    async onSuccess => {
      const hasExistingEncounter = await checkForExistingEncounter();
      if (hasExistingEncounter) {
        setIsWarningModalOpen(true);
      } else {
        await onSuccess();
      }
    },
    [checkForExistingEncounter],
  );

  return (
    <>
      <Box height={5} />
      <ContentPane data-testid="contentpane-3jxx">
        <PatientEncounterSummary
          viewEncounter={onViewEncounter}
          openCheckIn={() => withExistingEncounterCheck(() => setIsCheckInModalOpen(true))}
          patient={patient}
          disabled={disabled}
          data-testid="patientencountersummary-z703"
        />
      </ContentPane>
      {showOutpatientAppointments && (
        <ContentPane data-testid="contentpane-dvc2">
          <OutpatientAppointmentsTable
            patient={patient}
            data-testid="outpatientappointmentstable-27ad"
          />
        </ContentPane>
      )}
      {showLocationBookings && (
        <ContentPane data-testid="contentpane-epfl">
          <LocationBookingsTable patient={patient} data-testid="locationbookingstable-v4jv" />
        </ContentPane>
      )}
      <ContentPane data-testid="contentpane-n51k">
        <PatientHistory
          patient={patient}
          onItemClick={onViewEncounter}
          data-testid="patienthistory-yw6n"
        />
      </ContentPane>
      <EncounterModal
        open={isCheckInModalOpen}
        onClose={onCloseCheckInModal}
        patient={patient}
        patientBillingTypeId={additionalData?.patientBillingTypeId}
        data-testid="encountermodal-pnpe"
        withExistingEncounterCheck={withExistingEncounterCheck}
      />
      <ExistingEncounterWarningModal open={isWarningModalOpen} onClose={onCloseWarningModal} />
    </>
  );
});
