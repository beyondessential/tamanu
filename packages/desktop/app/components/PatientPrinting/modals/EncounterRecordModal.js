import React from 'react';

import { NOTE_TYPES } from 'shared/constants/notes';
import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants/statuses';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from 'shared/constants/diagnoses';

import { EncounterRecord } from '../printouts/EncounterRecord';
import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientData } from '../../../api/queries/usePatientData';
import { useLabRequests } from '../../../api/queries/useLabRequests';
import { useImagingRequests } from '../../../api/queries/useImagingRequests';
import { useEncounterNotes } from '../../../api/queries/useEncounterNotes';
import { useEncounterDischarge } from '../../../api/queries/useEncounterDischarge';
import { useReferenceData } from '../../../api/queries/useReferenceData';
import { usePatientAdditionalData } from '../../../api/queries/usePatientAdditionalData';
import { useLocalisation } from '../../../contexts/Localisation';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Colors } from '../../../constants';

// These below functions are used to extract the history of changes made to the encounter that are stored in notes.
// obviously a better solution needs to be to properly implemented for storing and accessing this data, but this is an ok workaround for now.

const locationNoteMatcher = /^Changed location from (?<from>.*) to (?<to>.*)/;
const encounterTypeNoteMatcher = /^Changed type from (?<from>.*) to (?<to>.*)/;

// This is the general function that extracts the important values from the notes into an object based on their regex matcher
const extractUpdateHistoryFromNoteData = (notes, encounterData, matcher) => {
  if (notes?.length > 0 && notes[0].noteItems[0].content.match(matcher)) {
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
  return null;
};

// These two functions both take the generated object based on the matcher from the above function and alters the data names to be relavant to the table.
// It will either loop through the generic history and rename the keys to relevant ones or it will just grab the current encounter details if there is no note history
const extractEncounterTypeHistory = (notes, encounterData) => {
  const history = extractUpdateHistoryFromNoteData(notes, encounterData, encounterTypeNoteMatcher);
  const encounterHistory = history?.map(({ to: newEncounterType, ...rest }) => ({
    newEncounterType,
    ...rest,
  }));
  if (encounterHistory) return encounterHistory;
  return [
    {
      newEncounterType: encounterData.encounterType,
      date: encounterData.startDate,
    },
  ];
};

const extractLocationHistory = (notes, encounterData) => {
  const history = extractUpdateHistoryFromNoteData(notes, encounterData, locationNoteMatcher);
  const locationHistory = history?.map(location => {
    const locationArr = location.to?.split(/,\s+/);
    const hasLocationGroup = locationArr.length > 1;
    return {
      newLocationGroup: hasLocationGroup && locationArr[0],
      newLocation: hasLocationGroup ? locationArr[1] : locationArr[0],
      date: location.date,
    };
  });
  if (locationHistory) return locationHistory;
  return [
    {
      newLocationGroup: encounterData.location.locationGroup?.name,
      newLocation: encounterData.location.name,
      date: encounterData.startDate,
    },
  ];
};

export const EncounterRecordModal = ({ encounter, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
  const certificateData = useCertificate();

  const patientQuery = usePatientData(encounter.patientId);
  const patient = patientQuery.data;

  const padDataQuery = usePatientAdditionalData(patient?.id);
  const padData = padDataQuery.data;

  // Filter and sort diagnoses: remove error/cancelled diagnosis, sort by whether it is primary and then date
  const diagnoses = encounter.diagnoses
    ?.filter(diagnosis => {
      return !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(diagnosis.certainty);
    })
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }
      return new Date(a.date) - new Date(b.date);
    });

  const procedures =
    encounter.procedures?.sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    }) || [];

  // Remove cancelled/entered in error labs. Attach parent lab request data to each test object in order to be displayed in table format
  const labFilterStatuses = [
    LAB_REQUEST_STATUSES.CANCELLED,
    LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
    LAB_REQUEST_STATUSES.DELETED,
  ];

  const labRequestsQuery = useLabRequests(encounter.id, {
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const labRequests = labRequestsQuery.data;
  const updatedLabRequests = [];
  if (labRequests) {
    labRequests.data.forEach(labRequest => {
      if (!labFilterStatuses.includes(labRequest.status)) {
        labRequest.tests.forEach(test => {
          updatedLabRequests.push({
            testType: test.labTestType.name,
            testCategory: labRequest.category.name,
            requestedByName: labRequest.requestedBy?.displayName,
            requestDate: labRequest.requestedDate,
            completedDate: test.completedDate,
          });
        });
      }
    });
  }

  // Remove cancelled/entered in error imaging requests.
  const imagingFilterStatuses = [
    IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
    IMAGING_REQUEST_STATUS_TYPES.DELETED,
  ];

  const imagingTypes = getLocalisation('imagingTypes') || {};

  const imagingRequestsQuery = useImagingRequests(encounter.id, {
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const imagingRequests = imagingRequestsQuery.data;
  const updatedImagingRequests = [];
  if (imagingRequests) {
    imagingRequests.data.forEach(imagingRequest => {
      if (!imagingFilterStatuses.includes(imagingRequest.status)) {
        updatedImagingRequests.push({
          ...imagingRequest,
          imagingName: imagingTypes[imagingRequest.imagingType],
        });
      }
    });
  }

  // Remove discontinued medications and sort by date
  const medications = encounter.medications
    .filter(medication => {
      return !medication.discontinued;
    })
    .sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });

  const dishchargeQuery = useEncounterDischarge(encounter);
  const discharge = dishchargeQuery.data;

  const villageQuery = useReferenceData(patient?.villageId);
  const village = villageQuery.name;

  const notesQuery = useEncounterNotes(encounter.id);
  const notes = notesQuery?.data?.data;

  const displayNotes = notes?.filter(note => {
    return note.noteType !== NOTE_TYPES.SYSTEM;
  });

  const systemNotes = notes?.filter(note => {
    return note.noteType === NOTE_TYPES.SYSTEM;
  });

  // Add orignal note to each note object linked to an edited note
  const linkedNotes = displayNotes?.map(note => {
    const updatedNote = JSON.parse(JSON.stringify(note));
    updatedNote.noteItems = note.noteItems.map(noteItem => {
      const updatedNoteItem = noteItem;
      const linkedNote = note.noteItems.find(item => item.id === noteItem.revisedById);
      updatedNoteItem.originalNote = linkedNote || { id: updatedNoteItem.id };
      return updatedNoteItem;
    });
    return updatedNote;
  });

  // Remove orignal notes that have been edited and duplicate edits
  const seen = new Set();
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
  const filteredNotes = linkedNotes?.map(note => {
    const noteCopy = note;
    noteCopy.noteItems = noteCopy.noteItems.reverse().filter(noteItem => {
      const duplicate = seen.has(noteItem.originalNote?.id);
      seen.add(noteItem.originalNote?.id);
      return !duplicate && !editedNoteIds.includes(noteItem.id);
    });
    return noteCopy;
  });

  // In order to show notes in the orginially created order this checks if it has an original note linked and sorts by
  // that first and then the actual note date if it has no link
  const orderedNotes = filteredNotes?.map(note => {
    return {
      ...note,
      noteItems: note.noteItems.sort((a, b) => {
        if (a.revisedById && b.revisedById) {
          return new Date(a.originalNote.date) - new Date(b.originalNote.date);
        }
        if (a.revisedById) {
          return new Date(a.originalNote.date) - new Date(b.date);
        }
        if (b.revisedById) {
          return new Date(a.date) - new Date(b.originalNote.date);
        }
        return new Date(a.date) - new Date(b.date);
      }),
    };
  });

  const locationSystemNotes = systemNotes?.filter(note => {
    return note.noteItems[0].content.match(locationNoteMatcher);
  });
  const locationHistory = locationSystemNotes
    ? extractLocationHistory(locationSystemNotes, encounter, locationNoteMatcher)
    : [];

  const encounterTypeSystemNotes = systemNotes?.filter(note => {
    return note.noteItems[0].content.match(encounterTypeNoteMatcher);
  });
  const encounterTypeHistory = encounterTypeSystemNotes
    ? extractEncounterTypeHistory(encounterTypeSystemNotes, encounter, encounterTypeNoteMatcher)
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
          diagnoses={diagnoses}
          procedures={procedures}
          labRequests={updatedLabRequests}
          imagingRequests={updatedImagingRequests}
          notes={orderedNotes}
          discharge={discharge}
          village={village}
          pad={padData}
          medications={medications}
        />
      )}
    </Modal>
  );
};
