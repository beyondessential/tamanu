import { describe, expect, test } from 'vitest';
import { buildPdfRenderPlan, NOTES_CHUNK_SIZE } from '../../app/utils/pdf/pdfRenderPlans';

const makeNotes = count => Array.from({ length: count }, (_, i) => ({ id: `note-${i}` }));

const encounterProps = overrides => ({
  id: 'encounter-record',
  patientData: { displayId: 'ABC123' },
  notes: [],
  vitalsData: [],
  recordedDates: [],
  ...overrides,
});

describe('buildPdfRenderPlan', () => {
  test('non-encounter printouts render as a single unprocessed document', () => {
    const props = { id: 'vaccine-certificate', foo: 'bar' };
    const plan = buildPdfRenderPlan(props);

    expect(plan.postProcess).toBe('none');
    expect(plan.jobs).toEqual([props]);
  });

  test('encounter record with no notes or vitals is a single main document', () => {
    const plan = buildPdfRenderPlan(encounterProps());

    expect(plan.postProcess).toBe('merge-and-stamp');
    expect(plan.jobs).toHaveLength(1);
    expect(plan.jobs[0].section).toBe('main');
    expect(plan.jobs[0].notes).toEqual([]);
  });

  test('notes within a single chunk stay on the main document', () => {
    const notes = makeNotes(NOTES_CHUNK_SIZE);
    const plan = buildPdfRenderPlan(encounterProps({ notes }));

    expect(plan.jobs).toHaveLength(1);
    expect(plan.jobs[0].section).toBe('main');
    expect(plan.jobs[0].notes).toHaveLength(NOTES_CHUNK_SIZE);
  });

  test('notes beyond one chunk spill into notes continuation documents', () => {
    const notes = makeNotes(NOTES_CHUNK_SIZE * 2 + 10);
    const plan = buildPdfRenderPlan(encounterProps({ notes }));

    expect(plan.jobs.map(job => job.section)).toEqual(['main', 'notes', 'notes']);
    expect(plan.jobs[0].notes).toHaveLength(NOTES_CHUNK_SIZE);
    expect(plan.jobs[1].notes).toHaveLength(NOTES_CHUNK_SIZE);
    expect(plan.jobs[2].notes).toHaveLength(10);

    // No note is dropped or duplicated across the chunks.
    const chunkedIds = plan.jobs.flatMap(job => job.notes.map(note => note.id));
    expect(chunkedIds).toEqual(notes.map(note => note.id));
  });

  test('vitals are appended as a trailing vitals document with no notes', () => {
    const notes = makeNotes(NOTES_CHUNK_SIZE + 1);
    const plan = buildPdfRenderPlan(
      encounterProps({ notes, vitalsData: [{ value: 1 }], recordedDates: ['2024-01-01'] }),
    );

    expect(plan.jobs.map(job => job.section)).toEqual(['main', 'notes', 'vitals']);
    const vitalsJob = plan.jobs.at(-1);
    expect(vitalsJob.notes).toEqual([]);
    expect(vitalsJob.vitalsData).toHaveLength(1);
  });

  test('every job carries the other props unchanged', () => {
    const plan = buildPdfRenderPlan(encounterProps({ notes: makeNotes(1) }));

    for (const job of plan.jobs) {
      expect(job.id).toBe('encounter-record');
      expect(job.patientData).toEqual({ displayId: 'ABC123' });
    }
  });

  test('encounter summary stays on the main document when notes fit one chunk', () => {
    const plan = buildPdfRenderPlan(
      encounterProps({ notes: makeNotes(NOTES_CHUNK_SIZE), encounterSummary: 'A summary' }),
    );

    expect(plan.jobs).toHaveLength(1);
    expect(plan.jobs[0].section).toBe('main');
    expect(plan.jobs[0].encounterSummary).toBe('A summary');
  });

  test('encounter summary rides on the last notes document, not mid-notes', () => {
    const notes = makeNotes(NOTES_CHUNK_SIZE * 2 + 1);
    const plan = buildPdfRenderPlan(encounterProps({ notes, encounterSummary: 'A summary' }));

    expect(plan.jobs.map(job => job.section)).toEqual(['main', 'notes', 'notes']);
    // The summary must not appear before later notes, so only the final notes job carries it.
    expect(plan.jobs[0].encounterSummary).toBeUndefined();
    expect(plan.jobs[1].encounterSummary).toBeUndefined();
    expect(plan.jobs[2].encounterSummary).toBe('A summary');
  });

  test('the trailing vitals document never carries the encounter summary', () => {
    const notes = makeNotes(NOTES_CHUNK_SIZE + 1);
    const plan = buildPdfRenderPlan(
      encounterProps({
        notes,
        encounterSummary: 'A summary',
        vitalsData: [{ value: 1 }],
        recordedDates: ['2024-01-01'],
      }),
    );

    expect(plan.jobs.at(-1).section).toBe('vitals');
    expect(plan.jobs.at(-1).encounterSummary).toBeUndefined();
  });

  test('notes and vitals jobs do not carry main-only section data', () => {
    const notes = makeNotes(NOTES_CHUNK_SIZE + 1);
    const plan = buildPdfRenderPlan(
      encounterProps({
        notes,
        diagnoses: [{ id: 'd1' }],
        medications: [{ id: 'm1' }],
        vitalsData: [{ value: 1 }],
        recordedDates: ['2024-01-01'],
      }),
    );

    const [mainJob, notesJob, vitalsJob] = plan.jobs;
    expect(mainJob.diagnoses).toHaveLength(1);
    expect(notesJob.diagnoses).toEqual([]);
    expect(notesJob.medications).toEqual([]);
    expect(vitalsJob.diagnoses).toEqual([]);
    // Only the vitals job needs the vitals data.
    expect(notesJob.vitalsData).toEqual([]);
    expect(vitalsJob.vitalsData).toHaveLength(1);
  });
});
