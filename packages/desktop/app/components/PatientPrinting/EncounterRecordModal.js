import React from 'react';

import { EncounterRecord } from './EncounterRecord';
import { Modal } from '../Modal';
import { useCertificate } from '../../utils/useCertificate';
import { usePatientData } from '../../api/queries/usePatientData';
import { useLabRequests } from '../../api/queries/useLabRequests';
import { useImagingRequests } from '../../api/queries/useImagingRequests';
import { useEncounterNotes } from '../../api/queries/useEncounterNotes';
import { useEncounterDischarge } from '../../api/queries/useEncounterDischarge';
import { useReferenceData } from '../../api/queries/useReferenceData';
import { usePatientAdditionalData } from '../../api/queries/usePatientAdditionalData';
// import { FacilityAndSyncVersionIncompatibleError } from 'shared/errors';
import { LoadingIndicator } from '../LoadingIndicator';

export const EncounterRecordModal = ({ encounter, open, onClose }) => {
  const certificateData = useCertificate();

  const patientQuery = usePatientData(encounter.patientId);
  const patient = patientQuery.data;

  const padDataQuery = usePatientAdditionalData(patient?.id);
  const padData = padDataQuery.data;

  const labRequestsQuery = useLabRequests(encounter.id, {
    includeNotePages: 'true',
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const labRequests = labRequestsQuery.data;

  const imagingRequestsQuery = useImagingRequests(encounter.id);
  const imagingRequests = imagingRequestsQuery.data;

  const notesQuery = useEncounterNotes(encounter.id);
  const notes = notesQuery.data;

  const dishchargeQuery = useEncounterDischarge(encounter.id);
  const discharge = dishchargeQuery.data;
  const villageQuery = useReferenceData(patient?.villageId);
  const village = villageQuery.name;

  return (
    <Modal title="Encounter Record" open={open} onClose={onClose} printable maxWidth="md">
      {!patientQuery.isSuccess ? (
        <LoadingIndicator />
      ) : (
        <EncounterRecord
          patient={patient}
          encounter={encounter}
          certificateData={certificateData}
          labRequests={labRequests}
          imagingRequests={imagingRequests}
          notes={notes}
          discharge={discharge}
          village={village}
          pad={padData}
        />
      )}
    </Modal>
  );
};
