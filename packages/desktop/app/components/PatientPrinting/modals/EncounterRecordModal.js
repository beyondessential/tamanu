import React from 'react';

import { NOTE_TYPES } from '@tamanu/constants/notes';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants/labs';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants/statuses';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/constants/diagnoses';
import { ForbiddenError } from '@tamanu/shared/errors';

import { EncounterRecord } from '../printouts/EncounterRecord';
import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientData } from '../../../api/queries/usePatientData';
import { useLabRequests } from '../../../api/queries/useLabRequests';
import { combineQueries } from '../../../api/combineQueries';
import { useImagingRequests } from '../../../api/queries/useImagingRequests';
import { useEncounterNotes } from '../../../api/queries/useEncounterNotes';
import { useEncounterDischarge } from '../../../api/queries/useEncounterDischarge';
import { useReferenceData } from '../../../api/queries/useReferenceData';
import { usePatientAdditionalData } from '../../../api/queries/usePatientAdditionalData';
import { useLocalisation } from '../../../contexts/Localisation';
import { LoadingIndicator } from '../../LoadingIndicator';
import { Colors } from '../../../constants';
import { ForbiddenErrorModalContents } from '../../ForbiddenErrorModal';
import { ModalActionRow } from '../../ModalActionRow';

// These below functions are used to extract the history of changes made to the encounter that are stored in notes.
// obviously a better solution needs to be to properly implemented for storing and accessing this data, but this is an ok workaround for now.

const locationNoteMatcher = /^Changed location from (?<from>.*) to (?<to>.*)/;
const encounterTypeNoteMatcher = /^Changed type from (?<from>.*) to (?<to>.*)/;

// This is the general function that extracts the important values from the notes into an object based on their regex matcher
const extractUpdateHistoryFromNoteData = (notes, encounterData, matcher) => {
  if (notes.length === 0) return null;

  const getMatch = noteItems => noteItems[0].content.match(matcher)?.groups;

  const match = getMatch(notes[0].noteItems);
  if (!match) return null;

  return [
    {
      to: match.from,
      date: encounterData.startDate,
    },
    ...notes.map(({ noteItems }) => {
      const { to } = getMatch(noteItems);
      const { date } = noteItems[0];
      return { to, date };
    }),
  ];
};

// These two functions both take the generated object based on the matcher from the above function and alters the data names to be relavant to the table.
// It will either loop through the generic history and rename the keys to relevant ones or it will just grab the current encounter details if there is no note history
const extractEncounterTypeHistory = (notes, encounterData) => {
  const history = extractUpdateHistoryFromNoteData(notes, encounterData, encounterTypeNoteMatcher);
  if (!history) {
    return [
      {
        newEncounterType: encounterData.encounterType,
        date: encounterData.startDate,
      },
    ];
  }

  return history.map(({ to: newEncounterType, ...rest }) => ({
    newEncounterType,
    ...rest,
  }));
};

const extractLocationHistory = (notes, encounterData) => {
  const history = extractUpdateHistoryFromNoteData(notes, encounterData, locationNoteMatcher);
  if (!history) {
    return [
      {
        newLocationGroup: encounterData.location.locationGroup?.name,
        newLocation: encounterData.location.name,
        date: encounterData.startDate,
      },
    ];
  }

  return history.map(location => {
    const locationArr = location.to?.split(/,\s+/);
    const hasLocationGroup = locationArr.length > 1;
    return {
      newLocationGroup: hasLocationGroup && locationArr[0],
      newLocation: hasLocationGroup ? locationArr[1] : locationArr[0],
      date: location.date,
    };
  });
};

export const EncounterRecordModal = ({ encounter, open, onClose }) => {
  const { getLocalisation } = useLocalisation();
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

  const imagingRequestsQuery = useImagingRequests(encounter.id, {
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const imagingRequestsData = imagingRequestsQuery.data?.data || [];

  const dischargeQuery = useEncounterDischarge(encounter);
  const discharge = dischargeQuery.data;

  const villageQuery = useReferenceData(patient?.villageId);
  const village = villageQuery.data?.name;

  const notesQuery = useEncounterNotes(encounter.id);
  const notes = notesQuery.data?.data || [];

  const allQueries = combineQueries([
    patientQuery,
    padDataQuery,
    labRequestsQuery,
    imagingRequestsQuery,
    dischargeQuery,
    villageQuery,
    notesQuery,
  ]);

  const modalProps = {
    title: 'Encounter Record',
    color: Colors.white,
    open,
    onClose,
    maxWidth: 'md',
    printable: !allQueries.isError && !allQueries.isFetching, // do not show print button when there is error or is fetching
  };

  if (allQueries.isFetching) {
    return (
      <Modal {...modalProps}>
        <LoadingIndicator />
      </Modal>
    );
  }

  if (allQueries.isError) {
    if (allQueries.errors.some(e => e instanceof ForbiddenError)) {
      return (
        <Modal {...modalProps}>
          <ForbiddenErrorModalContents onClose={onClose} />
        </Modal>
      );
    }
    // If this next bit ever shows up it means it's a bug - show some detail
    return (
      <Modal {...modalProps}>
        <p>An unexpected error occurred. Please contact your system administrator.</p>
        <p>Error details:</p>
        <pre>{JSON.stringify(allQueries.errors, null, 2)}</pre>
        <ModalActionRow onConfirm={onClose} confirmText="Close" />
      </Modal>
    );
  }

  // Filter and sort diagnoses: remove error/cancelled diagnosis, sort by whether it is primary and then date
  const diagnoses = encounter.diagnoses
    .filter(diagnosis => !DIAGNOSIS_CERTAINTIES_TO_HIDE.includes(diagnosis.certainty))
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }
      return new Date(a.date) - new Date(b.date);
    });

  const procedures = encounter.procedures.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Remove cancelled/entered in error labs. Attach parent lab request data to each test object in order to be displayed in table format
  const labFilterStatuses = [
    LAB_REQUEST_STATUSES.CANCELLED,
    LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
    LAB_REQUEST_STATUSES.DELETED,
  ];

  const updatedLabRequests = [];
  if (labRequests) {
    labRequests.data.forEach(labRequest => {
      if (!labFilterStatuses.includes(labRequest.status)) {
        labRequest.tests.forEach(test => {
          updatedLabRequests.push({
            testType: test.labTestType.name,
            testCategory: labRequest.category?.name,
            requestedByName: labRequest.requestedBy?.displayName,
            requestDate: labRequest.requestedDate,
            completedDate: test.completedDate,
          });
        });
      }
    });
  }

  // Remove cancelled/entered in error imaging requests.
  const imagingStatusesToExclude = [
    IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
    IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
    IMAGING_REQUEST_STATUS_TYPES.DELETED,
  ];

  const imagingTypeNames = getLocalisation('imagingTypes') || {};

  const imagingRequests = imagingRequestsData
    .filter(({ status }) => !imagingStatusesToExclude.includes(status))
    .map(imagingRequest => ({
      ...imagingRequest,
      imagingName: imagingTypeNames[imagingRequest.imagingType],
    }));

  // Remove discontinued medications and sort by date
  const medications = encounter.medications
    .filter(medication => !medication.discontinued)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const displayNotes = notes.filter(note => note.noteType !== NOTE_TYPES.SYSTEM);

  // Add orignal note to each note object linked to an edited note
  const linkedNotes = displayNotes.map(note => {
    const updatedNote = JSON.parse(JSON.stringify(note));
    updatedNote.noteItems = note.noteItems.map(noteItem => {
      const updatedNoteItem = noteItem;
      const linkedNote = note.noteItems.find(item => item.id === noteItem.revisedById);
      updatedNoteItem.originalNote = linkedNote || { id: updatedNoteItem.id };
      return updatedNoteItem;
    });
    return updatedNote;
  });

  // Remove original notes that have been edited and duplicate edits
  const revisedByIds = new Set();
  notes.forEach(note => {
    note.noteItems.forEach(noteItem => {
      if (noteItem.revisedById) {
        revisedByIds.add(noteItem.revisedById);
      }
    });
  });

  const seenNotes = new Set();
  const filteredNotes = linkedNotes.map(note => {
    const noteCopy = note;
    noteCopy.noteItems = noteCopy.noteItems.reverse().filter(noteItem => {
      const duplicate = seenNotes.has(noteItem.originalNote?.id);
      seenNotes.add(noteItem.originalNote?.id);
      return !duplicate && !revisedByIds.has(noteItem.id);
    });
    return noteCopy;
  });

  // In order to show notes in the orginially created order this checks if it has an original note linked and sorts by
  // that first and then the actual note date if it has no link
  const orderedNotes = filteredNotes.map(note => {
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

  const systemNotes = notes.filter(note => note.noteType === NOTE_TYPES.SYSTEM);

  const locationSystemNotes = systemNotes.filter(note =>
    note.noteItems[0].content.match(locationNoteMatcher),
  );
  const locationHistory = extractLocationHistory(
    locationSystemNotes,
    encounter,
    locationNoteMatcher,
  );

  const encounterTypeSystemNotes = systemNotes.filter(note =>
    note.noteItems[0].content.match(encounterTypeNoteMatcher),
  );
  const encounterTypeHistory = extractEncounterTypeHistory(
    encounterTypeSystemNotes,
    encounter,
    encounterTypeNoteMatcher,
  );

  return (
    <Modal {...modalProps}>
      <EncounterRecord
        patient={patient}
        encounter={encounter}
        certificateData={certificateData}
        encounterTypeHistory={encounterTypeHistory}
        locationHistory={locationHistory}
        diagnoses={diagnoses}
        procedures={procedures}
        labRequests={updatedLabRequests}
        imagingRequests={imagingRequests}
        notes={orderedNotes}
        discharge={discharge}
        village={village}
        pad={padData}
        medications={medications}
      />
    </Modal>
  );
};
