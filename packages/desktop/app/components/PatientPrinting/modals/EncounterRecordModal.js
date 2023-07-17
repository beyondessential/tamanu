import React from 'react';
import { groupBy } from 'lodash';

import { NOTE_TYPES } from '@tamanu/shared/constants/notes';
import { LAB_REQUEST_STATUSES } from '@tamanu/shared/constants/labs';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/shared/constants/statuses';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/shared/constants/diagnoses';

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
  if (notes?.length > 0 && notes[0].content.match(matcher)) {
    const {
      groups: { from },
    } = notes[0].content.match(matcher);

    const history = [
      {
        to: from,
        date: encounterData.startDate,
      },
      ...notes?.map(({ content, date }) => {
        const {
          groups: { to },
        } = content.match(matcher);
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
  const village = villageQuery?.data?.name;

  const notesQuery = useEncounterNotes(encounter.id);
  const notes = notesQuery?.data?.data;

  const rootNotes =
    notes
      ?.filter(note => note.noteType !== NOTE_TYPES.SYSTEM && !note.revisedById)
      .sort((a, b) => new Date(a.date) - new Date(b.date)) || [];
  const revisedNotes =
    notes
      ?.filter(note => note.noteType !== NOTE_TYPES.SYSTEM && !!note.revisedById)
      .sort((a, b) => new Date(b.date) - new Date(a.date)) || [];
  const revisedNotesByRootNoteId = groupBy(revisedNotes, 'revisedById');
  const displayNotes = rootNotes.map(
    rootNote => revisedNotesByRootNoteId[rootNote.id]?.[0] || rootNote,
  );

  const systemNotes = notes?.filter(note => {
    return note.noteType === NOTE_TYPES.SYSTEM;
  });

  const locationSystemNotes = systemNotes?.filter(note => {
    return note.content.match(locationNoteMatcher);
  });
  const locationHistory = locationSystemNotes
    ? extractLocationHistory(locationSystemNotes, encounter, locationNoteMatcher)
    : [];

  const encounterTypeSystemNotes = systemNotes?.filter(note => {
    return note.content.match(encounterTypeNoteMatcher);
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
          notes={displayNotes}
          discharge={discharge}
          village={village}
          pad={padData}
          medications={medications}
        />
      )}
    </Modal>
  );
};
