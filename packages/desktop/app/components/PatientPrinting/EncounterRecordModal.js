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
import { Colors } from '../../constants';

export const EncounterRecordModal = ({ encounter, open, onClose }) => {
  const certificateData = useCertificate();

  const patientQuery = usePatientData(encounter.patientId);
  const patient = patientQuery.data;

  const padDataQuery = usePatientAdditionalData(patient?.id);
  const padData = padDataQuery.data;

  const labRequestsQuery = useLabRequests(encounter.id, {
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const labRequests = labRequestsQuery.data;
  const updatedLabRequests = {
    data: [],
  };
  if (labRequests) {
    labRequests.data.forEach(labRequest => {
      labRequest.tests.forEach(test => {
        updatedLabRequests.data.push({
          testType: test.labTestType.name,
          testCategory: labRequest.category.name,
          requestingClinician: labRequest.requestedBy.displayName,
          requestDate: labRequest.requestedDate,
          completedDate: test.completedDate,
        });
      });
    });
  }
  // TODO NEED TO GET THE COMPLETED DATE FOR THIS
  const imagingRequestsQuery = useImagingRequests(encounter.id);
  const imagingRequests = imagingRequestsQuery.data;

  const dishchargeQuery = useEncounterDischarge(encounter.id);
  const discharge = dishchargeQuery.data;

  const villageQuery = useReferenceData(patient?.villageId);
  const village = villageQuery.name;

  const notesQuery = useEncounterNotes(encounter.id);
  const notes = notesQuery?.data?.data;

  // Get the ids of the notes that have been edited - TODO this filtering should really be done here rather than on the front end
  const editedNoteIds = [];
  if (notes) {
    notes.forEach(note => {
      note.noteItems.forEach(noteItem => {
        if (noteItem.revisedById) {
          editedNoteIds.push(noteItem.revisedById);
        }
      });
    });
  }

  const filteredNotes = notes?.filter(note => {
    return note.noteType !== 'system';
  });

  const systemNotes = notes?.filter(note => {
    return note.noteType === 'system';
  });

  // TODO NEED TO TURN NOTES INTO USABLE OBJECTS
  const getPlaceHistoryFromNotes = (locationNotes, encounterData) => {
    if (locationNotes.length > 0 && locationNotes[0].noteItems[0].content.match(matcher)) {
      const {
        groups: { from },
      } = locationNotes[0].noteItems[0].content.match(matcher);

      const history = [
        {
          to: from,
          date: encounterData.startDate,
        },
        ...locationNotes[0]?.noteItems.map(({ content, date }) => {
          const {
            groups: { to },
          } = content.match(matcher);
          return { to, date };
        }),
      ];
      return history;
    }

    return [
      {
        to: `${encounterData.location.locationGroup.name}, ${encounterData.location.name}`,
        date: encounterData.startDate,
      },
    ];
  };

  const matcher = /^Changed location from (?<from>.*) to (?<to>.*)/;

  const locationSystemNotes = systemNotes?.filter(note => {
    return note.noteItems[0].content.match(matcher);
  });

  const locationHistory = locationSystemNotes
    ? getPlaceHistoryFromNotes(locationSystemNotes, encounter)
    : [];

  const encounterTypes = systemNotes?.map(note => {
    return {
      encounterType: note.noteItems[0].content,
      date: note.date,
    };
  });

  return (
    <Modal
      title="Encounter Record"
      color={Colors.white}
      open={open}
      onClose={onClose}
      printable
      maxWidth="md"
    >
      {!patientQuery.isSuccess ? (
        <LoadingIndicator />
      ) : (
        <EncounterRecord
          patient={patient}
          encounter={encounter}
          certificateData={certificateData}
          encounterTypes={encounterTypes}
          locationHistory={locationHistory}
          labRequests={updatedLabRequests}
          imagingRequests={imagingRequests}
          notes={filteredNotes}
          editedNoteIds={editedNoteIds}
          discharge={discharge}
          village={village}
          pad={padData}
        />
      )}
    </Modal>
  );
};
