import { chunk } from 'lodash';

// Notes are rendered in slices of this size. Each slice becomes its own bounded render so the
// per-render react-pdf layout tree never grows large enough to exhaust worker memory. Kept well
// clear of the point where a single render starts to struggle.
export const NOTES_CHUNK_SIZE = 500;

// Sections that only the 'main' document renders. They're blanked to empty arrays on the other
// jobs so each job doesn't structured-clone (into the worker) data it never draws.
const MAIN_ONLY_SECTIONS = [
  'encounterTypeHistory',
  'locationHistory',
  'diagnoses',
  'procedures',
  'labRequests',
  'imagingRequests',
  'medications',
];

const blankMainOnlySections = () =>
  Object.fromEntries(MAIN_ONLY_SECTIONS.map(field => [field, []]));

// The encounter record is decomposed into:
//   - one 'main' document: every section plus the first chunk of notes (no vitals),
//   - one 'notes' continuation document per remaining chunk,
//   - one trailing 'vitals' document (vitals are bounded, so they aren't chunked).
// These render in parallel and are merged in order, with a continuous page-number footer
// stamped on afterwards. Small encounters still flow through this path as main (+ vitals).
const buildEncounterRecordPlan = props => {
  const notes = props.notes ?? [];
  const noteChunks = notes.length > 0 ? chunk(notes, NOTES_CHUNK_SIZE) : [[]];
  const [firstChunk, ...continuationChunks] = noteChunks;

  // The encounter summary belongs after all notes, so it rides on the last notes-bearing
  // document: the final continuation when notes spill past one chunk, otherwise main.
  const lastNotesSection = continuationChunks.length > 0 ? 'lastContinuation' : 'main';

  const mainJob = {
    ...props,
    section: 'main',
    notes: firstChunk,
    vitalsData: [],
    recordedDates: [],
    encounterSummary: lastNotesSection === 'main' ? props.encounterSummary : undefined,
  };

  const notesJobs = continuationChunks.map((notesSlice, index) => ({
    ...props,
    ...blankMainOnlySections(),
    section: 'notes',
    notes: notesSlice,
    vitalsData: [],
    recordedDates: [],
    encounterSummary:
      index === continuationChunks.length - 1 ? props.encounterSummary : undefined,
  }));

  const jobs = [mainJob, ...notesJobs];

  const hasVitals = (props.vitalsData?.length ?? 0) > 0 && (props.recordedDates?.length ?? 0) > 0;
  if (hasVitals) {
    jobs.push({
      ...props,
      ...blankMainOnlySections(),
      section: 'vitals',
      notes: [],
      encounterSummary: undefined,
    });
  }

  return { jobs, postProcess: 'merge-and-stamp' };
};

const PLAN_BUILDERS = {
  'encounter-record': buildEncounterRecordPlan,
};

/**
 * Build the render plan for a given printout id. Printouts without a registered builder render
 * as a single document (unchanged behaviour); registering a builder is all it takes to add
 * chunked + merged rendering to a new printout.
 */
export const buildPdfRenderPlan = props => {
  const builder = PLAN_BUILDERS[props.id];
  if (builder) {
    return builder(props);
  }
  return { jobs: [props], postProcess: 'none' };
};
