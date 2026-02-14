import React from 'react';

import { NOTE_TYPES } from '@tamanu/constants/notes';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants/labs';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/constants/statuses';
import { DIAGNOSIS_CERTAINTIES_TO_HIDE } from '@tamanu/constants/diagnoses';
import { ForbiddenError, NotFoundError } from '@tamanu/errors';

import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';
import { useLabRequestsQuery } from '../../../api/queries/useLabRequestsQuery';
import { combineQueries } from '../../../api/combineQueries';
import { useImagingRequestsQuery } from '../../../api/queries/useImagingRequestsQuery';
import { useEncounterNotesQuery } from '../../../api/queries/useEncounterNotesQuery';
import { useEncounterDischargeQuery } from '../../../api/queries/useEncounterDischargeQuery';
import { useReferenceDataQuery } from '../../../api/queries/useReferenceDataQuery';
import { usePatientAdditionalDataQuery } from '../../../api/queries/usePatientAdditionalDataQuery';
import { useLocalisation } from '../../../contexts/Localisation';
import { Colors } from '../../../constants';
import { ForbiddenErrorModalContents } from '../../ForbiddenErrorModal';
import { ModalActionRow } from '../../ModalActionRow';
import { printPDF } from '../PDFLoader';
import { TranslatedText } from '../../Translation/TranslatedText';
import { useVitalsQuery } from '../../../api/queries/useVitalsQuery';
import { useTranslation } from '../../../contexts/Translation';
import { LoadingIndicator } from '../../LoadingIndicator';
import { WorkerRenderedPDFViewer } from '../WorkerRenderedPDFViewer';
import { useSettings } from '../../../contexts/Settings';

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
      ...(notes?.map(({ content, date }) => {
        const {
          groups: { to },
        } = content.match(matcher);
        return { to, date };
      }) ?? {}),
    ];
    return history;
  }
  return null;
};

// These two functions both take the generated object based on the matcher from the above function and alters the data names to be relevant to the table.
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
  const { translations, storedLanguage } = useTranslation();
  const { settings } = useSettings();
  const { localisation, getLocalisation } = useLocalisation();
  const { data: vitalsData, recordedDates } = useVitalsQuery(encounter.id);

  const certificateQuery = useCertificate();
  const { data: certificateData } = certificateQuery;

  const patientQuery = usePatientDataQuery(encounter.patientId);
  const patient = patientQuery.data;
  const padDataQuery = usePatientAdditionalDataQuery(patient?.id);
  const { data: additionalData } = padDataQuery;

  const labRequestsQuery = useLabRequestsQuery(encounter.id, {
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const labRequests = labRequestsQuery.data;

  const imagingRequestsQuery = useImagingRequestsQuery(encounter.id, {
    order: 'asc',
    orderBy: 'requestedDate',
  });
  const imagingRequestsData = imagingRequestsQuery.data?.data || [];

  const dischargeQuery = useEncounterDischargeQuery(encounter);
  const discharge = dischargeQuery.data;

  const villageQuery = useReferenceDataQuery(patient?.villageId);
  const village = villageQuery.data;

  const notesQuery = useEncounterNotesQuery(encounter.id, {
    orderBy: 'date',
    order: 'ASC',
  }); // order notes by edited date
  const notes = notesQuery?.data?.data || [];

  const allQueries = combineQueries([
    patientQuery,
    padDataQuery,
    labRequestsQuery,
    imagingRequestsQuery,
    dischargeQuery,
    villageQuery,
    notesQuery,
    certificateQuery,
  ]);

  const modalProps = {
    title: discharge ? (
      <TranslatedText
        stringId="patient.modal.print.encounterRecord.title"
        fallback="Encounter Record"
        data-testid="translatedtext-fzew"
      />
    ) : (
      <TranslatedText
        stringId="patient.modal.print.encounterProgressRecord.title"
        fallback="Patient Encounter Progress Record"
        data-testid="translatedtext-9czu"
      />
    ),
    color: Colors.white,
    open,
    onClose,
    maxWidth: 'md',
    printable: !allQueries.isError && !allQueries.isFetching, // do not show print button when there is error or is fetching
  };

  if (allQueries.isError) {
    if (allQueries.errors.some(e => e instanceof ForbiddenError)) {
      return (
        <Modal {...modalProps} data-testid="modal-5jy7">
          <ForbiddenErrorModalContents
            onClose={onClose}
            data-testid="forbiddenerrormodalcontents-00se"
          />
        </Modal>
      );
    }

    // Some old discharged encounters do not have discharge record
    // It is a data issue and we don't want to it to break the entire Encounter Summary
    const hasOnlyDischargeNotFoundError =
      allQueries.errors.length === 1 &&
      dischargeQuery.isError &&
      dischargeQuery.error instanceof NotFoundError;

    if (!hasOnlyDischargeNotFoundError) {
      // If this next bit ever shows up it means it's a bug - show some detail
      return (
        <Modal {...modalProps} data-testid="modal-hoyx">
          <p>An unexpected error occurred. Please contact your system administrator.</p>
          <p>Error details:</p>
          <pre>{JSON.stringify(allQueries.errors, null, 2)}</pre>
          <ModalActionRow
            onConfirm={onClose}
            confirmText="Close"
            data-testid="modalactionrow-db91"
          />
        </Modal>
      );
    }
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
    LAB_REQUEST_STATUSES.INVALIDATED,
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
            publishedDate: labRequest.publishedDate,
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

  // Remove discontinued medications and sort by medication name
  const medications = encounter.medications
    .filter(
      medication =>
        (encounter.endDate
          ? medication.encounterPrescription?.isSelectedForDischarge
          : !medication.discontinued) && !medication.medication?.referenceDrug?.isSensitive,
    )
    .sort((a, b) => a.medication.name.localeCompare(b.medication.name));

  const displayNotes = notes.filter(note => {
    return note.noteTypeId !== NOTE_TYPES.SYSTEM;
  });

  const systemNotes = notes.filter(note => {
    return note.noteTypeId === NOTE_TYPES.SYSTEM;
  });

  const locationSystemNotes = systemNotes.filter(note => {
    return note.content.match(locationNoteMatcher);
  });
  const locationHistory = locationSystemNotes
    ? extractLocationHistory(locationSystemNotes, encounter, locationNoteMatcher)
    : [];

  const encounterTypeSystemNotes = systemNotes.filter(note => {
    return note.content.match(encounterTypeNoteMatcher);
  });
  const encounterTypeHistory = encounterTypeSystemNotes
    ? extractEncounterTypeHistory(encounterTypeSystemNotes, encounter, encounterTypeNoteMatcher)
    : [];

  return (
    <Modal {...modalProps} onPrint={() => printPDF('encounter-record')} data-testid="modal-fxo5">
      {allQueries.isFetching ? (
        <LoadingIndicator height="500px" data-testid="loadingindicator-skvx" />
      ) : (
        <WorkerRenderedPDFViewer
          id="encounter-record"
          queryDeps={[encounter.id]}
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          vitalsData={vitalsData}
          recordedDates={recordedDates}
          certificateData={certificateData}
          encounterTypeHistory={encounterTypeHistory}
          locationHistory={locationHistory}
          diagnoses={diagnoses}
          procedures={procedures}
          labRequests={updatedLabRequests}
          imagingRequests={imagingRequests}
          language={storedLanguage}
          notes={displayNotes}
          discharge={discharge}
          village={village}
          medications={medications}
          localisation={localisation}
          translations={translations}
          settings={settings}
          data-testid="encounterrecordprintout-yqe1"
        />
      )}
    </Modal>
  );
};
