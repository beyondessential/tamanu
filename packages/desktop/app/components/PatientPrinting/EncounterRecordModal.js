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

// TAKES A GROUP OF ENCOUNTER/LOCATION SYSTEM NOTES AND TURNS IT INTO AN OBJECT WITH EITHER LOCATION OR ENCOUNTER TYPE HISTORY DATA TO BE DISPLAYED
const locationNoteMatcher = /^Changed location from (?<from>.*) to (?<to>.*)/;
const encounterTypeNoteMatcher = /^Changed type from (?<from>.*) to (?<to>.*)/;
const extractNoteData = (notes, encounterData, matcher) => {
  if (notes.length > 0 && notes[0].noteItems[0].content.match(matcher)) {
    const {
      groups: { from },
    } = notes[0].noteItems[0].content.match(matcher);

    const history = [
      {
        to: from,
        date: encounterData.startDate,
      },
      ...notes?.map(({ noteItems }) => {
        const {
          groups: { to },
        } = noteItems[0].content.match(matcher);
        const { date } = noteItems[0];
        return { to, date };
      }),
    ];
    return history;
  }
  if (matcher === locationNoteMatcher) {
    return [
      {
        to: `${encounterData.location.locationGroup.name}, ${encounterData.location.name}`,
        date: encounterData.startDate,
      },
    ];
  }
  if (matcher === encounterTypeNoteMatcher) {
    return [
      {
        to: encounterData.encounterType,
        date: encounterData.startDate,
      },
    ];
  }

  return [];
};

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

  const filteredNotes = notes?.map(note => {
    const updatedNote = note;
    updatedNote.noteItems = updatedNote.noteItems.filter(noteItem => {
      return !editedNoteIds.includes(noteItem.id);
    });
    return updatedNote;
  });

  const systemNotes = notes?.filter(note => {
    return note.noteType === 'system';
  });

  const locationSystemNotes = systemNotes?.filter(note => {
    return note.noteItems[0].content.match(locationNoteMatcher);
  });
  const locationHistory = locationSystemNotes
    ? extractNoteData(locationSystemNotes, encounter, locationNoteMatcher)
    : [];

  const encounterTypeSystemNotes = systemNotes?.filter(note => {
    return note.noteItems[0].content.match(encounterTypeNoteMatcher);
  });
  const encounterTypeHistory = encounterTypeSystemNotes
    ? extractNoteData(encounterTypeSystemNotes, encounter, encounterTypeNoteMatcher)
    : [];

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
          encounterTypeHistory={encounterTypeHistory}
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
