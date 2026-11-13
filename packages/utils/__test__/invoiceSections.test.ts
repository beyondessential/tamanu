import { describe, it, expect } from 'vitest';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import {
  buildEncounterPeriod,
  buildInvoiceSections,
  isInvoiceSectioned,
  keepsRecordedDate,
  resolveEncounterPeriod,
  resolveSectionPeriods,
} from '../src/invoice/sections';

const configuredSections = [
  { id: 'section-outpatient', code: 'outpatient', name: 'Outpatient' },
  { id: 'section-emergency', code: 'emergency', name: 'Emergency' },
  { id: 'section-inpatient', code: 'inpatient', name: 'Inpatient' },
];

const build = (args: Parameters<typeof buildInvoiceSections>[0]) =>
  buildInvoiceSections({ configuredSections, ...args });

describe('buildInvoiceSections', () => {
  it('gives an encounter that never moved a single running section', () => {
    expect(
      build({
        encounter: { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 09:00:00' },
        revisions: [
          { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 09:00:00' },
        ],
      }),
    ).toEqual([
      {
        invoiceSectionId: 'section-outpatient',
        code: 'outpatient',
        name: 'Outpatient',
        startDate: '2026-03-01',
        endDate: null,
      },
    ]);
  });

  it('splits at an admission, with the move day in both periods', () => {
    const sections = build({
      encounter: { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' },
      revisions: [
        { encounterType: ENCOUNTER_TYPES.TRIAGE, startDate: '2026-03-01 09:00:00' },
        { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' },
      ],
    });

    expect(sections.map(section => [section.code, section.startDate, section.endDate])).toEqual([
      ['emergency', '2026-03-01', '2026-03-04'],
      ['inpatient', '2026-03-04', null],
    ]);
  });

  it('does not open a new section for a move within one category', () => {
    const sections = build({
      encounter: { encounterType: ENCOUNTER_TYPES.EMERGENCY, startDate: '2026-03-01 09:00:00' },
      revisions: [
        { encounterType: ENCOUNTER_TYPES.TRIAGE, startDate: '2026-03-01 09:00:00' },
        { encounterType: ENCOUNTER_TYPES.OBSERVATION, startDate: '2026-03-01 11:00:00' },
        { encounterType: ENCOUNTER_TYPES.EMERGENCY, startDate: '2026-03-02 08:00:00' },
      ],
    });

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({ code: 'emergency', startDate: '2026-03-01' });
  });

  it('moves the boundary when the admission date is corrected afterwards', () => {
    const sections = build({
      // The encounter's own start date is the corrected one, a day earlier than first recorded.
      encounter: { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-03 14:30:00' },
      revisions: [
        { encounterType: ENCOUNTER_TYPES.TRIAGE, startDate: '2026-03-01 09:00:00' },
        { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' },
      ],
    });

    expect(sections.map(section => [section.startDate, section.endDate])).toEqual([
      ['2026-03-01', '2026-03-03'],
      ['2026-03-03', null],
    ]);
  });

  it('closes the last period at the encounter end', () => {
    const sections = build({
      encounter: {
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        startDate: '2026-03-04 14:30:00',
        endDate: '2026-03-09 10:00:00',
      },
      revisions: [{ encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' }],
    });

    expect(sections[0]).toMatchObject({ startDate: '2026-03-04', endDate: '2026-03-09' });
  });

  it('falls back to the encounter alone when the facility holds no revisions', () => {
    const sections = build({
      encounter: { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' },
      revisions: [],
    });

    expect(sections).toEqual([
      {
        invoiceSectionId: 'section-inpatient',
        code: 'inpatient',
        name: 'Inpatient',
        startDate: '2026-03-04',
        endDate: null,
      },
    ]);
  });

  it('still shows a section its items carry when that period is unknown', () => {
    const sections = build({
      encounter: { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' },
      revisions: [],
      itemSectionIds: ['section-emergency', 'section-inpatient', null],
    });

    expect(sections.map(section => [section.code, section.startDate])).toEqual([
      ['inpatient', '2026-03-04'],
      ['emergency', null],
    ]);
  });

  it('reads a category the encounter returns to as one section spanning both periods', () => {
    // A clinic encounter set to admission by mistake and corrected back. An item records only its
    // section, so two outpatient sections could not be told apart and every outpatient item would
    // render under each.
    const sections = build({
      encounter: { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-06 10:00:00' },
      revisions: [
        { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 09:00:00' },
        { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-03-04 14:30:00' },
        { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-06 10:00:00' },
      ],
    });

    expect(sections.map(section => section.invoiceSectionId)).toEqual([
      'section-outpatient',
      'section-inpatient',
    ]);
    const outpatient = sections.find(s => s.invoiceSectionId === 'section-outpatient');
    expect(outpatient).toMatchObject({ startDate: '2026-03-01', endDate: null });
  });

  it('never lets a corrected admission date move a boundary backwards', () => {
    // The admission is corrected to before the triage it follows. Left alone the emergency period
    // would end before it began, inverting the picker bounds so nothing could be selected.
    const sections = build({
      encounter: { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-02-28 14:30:00' },
      revisions: [
        { encounterType: ENCOUNTER_TYPES.TRIAGE, startDate: '2026-03-01 09:00:00' },
        { encounterType: ENCOUNTER_TYPES.ADMISSION, startDate: '2026-02-28 14:30:00' },
      ],
    });

    for (const section of sections) {
      if (section.startDate && section.endDate) {
        expect(section.startDate <= section.endDate).toBe(true);
      }
    }
  });

  it('resolves boundaries in the facility timezone, not the storage one', () => {
    // Stored datetimes are in the primary timezone. Just after midnight in Auckland is still the
    // previous day in Honolulu, and the invoice is read and picked where the facility is.
    const [section] = build({
      encounter: { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 00:30:00' },
      revisions: [{ encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 00:30:00' }],
      primaryTimeZone: 'Pacific/Auckland',
      facilityTimeZone: 'Pacific/Honolulu',
    });

    expect(section.startDate).toBe('2026-02-28');
  });

  it('keeps the stored date where no timezone is given', () => {
    const [section] = build({
      encounter: { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 00:30:00' },
      revisions: [{ encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 00:30:00' }],
    });

    expect(section.startDate).toBe('2026-03-01');
  });

  it('leaves out an encounter type that is never sectioned', () => {
    expect(
      build({
        encounter: {
          encounterType: ENCOUNTER_TYPES.VACCINATION,
          startDate: '2026-03-01 09:00:00',
        },
      }),
    ).toEqual([]);
  });

  it('leaves out a category the deployment has not configured', () => {
    expect(
      buildInvoiceSections({
        configuredSections: [{ id: 'section-inpatient', code: 'inpatient', name: 'Inpatient' }],
        encounter: { encounterType: ENCOUNTER_TYPES.CLINIC, startDate: '2026-03-01 09:00:00' },
      }),
    ).toEqual([]);
  });
});

describe('resolveSectionPeriods', () => {
  const EMERGENCY = 'section-emergency';
  const encounterPeriod = { startDate: '2026-03-01', endDate: '2026-03-18' };
  const TODAY = '2026-03-20';

  it("keeps a section's own period where it is known", () => {
    const periods = resolveSectionPeriods(
      [{ invoiceSectionId: EMERGENCY, code: 'emergency', name: 'Emergency', startDate: '2026-03-01', endDate: '2026-03-04' }],
      encounterPeriod,
      TODAY,
    );
    expect(periods[EMERGENCY]).toEqual({ startDate: '2026-03-01', endDate: '2026-03-04' });
  });

  it('ends a still-running period today', () => {
    const periods = resolveSectionPeriods(
      [{ invoiceSectionId: EMERGENCY, code: 'emergency', name: 'Emergency', startDate: '2026-03-04', endDate: null }],
      { startDate: '2026-03-01', endDate: null },
      TODAY,
    );
    expect(periods[EMERGENCY]).toEqual({ startDate: '2026-03-04', endDate: TODAY });
  });

  it("falls back to the encounter's own span where the period is unknown", () => {
    const periods = resolveSectionPeriods(
      [{ invoiceSectionId: EMERGENCY, code: 'emergency', name: 'Emergency', startDate: null, endDate: null }],
      encounterPeriod,
      TODAY,
    );
    expect(periods[EMERGENCY]).toEqual({ startDate: '2026-03-01', endDate: '2026-03-18' });
  });

  it('is empty for an invoice that is not divided into sections', () => {
    expect(resolveSectionPeriods(null, encounterPeriod, TODAY)).toEqual({});
  });
});

describe('resolveEncounterPeriod', () => {
  it('resolves an open encounter to today', () => {
    expect(resolveEncounterPeriod({ startDate: '2026-03-01', endDate: null }, '2026-03-20')).toEqual(
      { startDate: '2026-03-01', endDate: '2026-03-20' },
    );
  });

  it('keeps a closed encounter at its end', () => {
    expect(
      resolveEncounterPeriod({ startDate: '2026-03-01', endDate: '2026-03-18' }, '2026-03-20'),
    ).toEqual({ startDate: '2026-03-01', endDate: '2026-03-18' });
  });

  it('is unknown without an encounter period', () => {
    expect(resolveEncounterPeriod(null, '2026-03-20')).toBeNull();
  });
});

describe('buildEncounterPeriod', () => {
  it("resolves the encounter's span in the facility timezone", () => {
    expect(
      buildEncounterPeriod({
        encounter: { startDate: '2026-03-01 00:30:00', endDate: null },
        primaryTimeZone: 'Pacific/Auckland',
        facilityTimeZone: 'Pacific/Honolulu',
      }),
    ).toEqual({ startDate: '2026-02-28', endDate: null });
  });
});

describe('isInvoiceSectioned', () => {
  const section = (id: string) => ({ invoiceSectionId: id, code: id, name: id, startDate: null, endDate: null });

  it('is not sectioned where splitting gives no sections', () => {
    expect(isInvoiceSectioned(null, [{ invoiceSectionId: null }])).toBe(false);
  });

  it('is not sectioned where one section holds every charge', () => {
    expect(isInvoiceSectioned([section('a')], [{ invoiceSectionId: 'a' }])).toBe(false);
  });

  it('is sectioned once the encounter has moved', () => {
    expect(isInvoiceSectioned([section('a'), section('b')], [])).toBe(true);
  });

  it('is sectioned where one section sits beside an item carrying none', () => {
    expect(isInvoiceSectioned([section('a')], [{ invoiceSectionId: null }])).toBe(true);
  });

  it('is sectioned where an item names a section the invoice no longer lists', () => {
    expect(isInvoiceSectioned([section('a')], [{ invoiceSectionId: 'hidden' }])).toBe(true);
  });
});

describe('keepsRecordedDate', () => {
  it('keeps an already-saved row whose date is untouched', () => {
    expect(
      keepsRecordedDate({ isExistingItem: true, orderDate: '2026-03-02', originalOrderDate: '2026-03-02' }),
    ).toBe(true);
  });

  it('bounds an already-saved row once its date is edited', () => {
    expect(
      keepsRecordedDate({ isExistingItem: true, orderDate: '2026-03-06', originalOrderDate: '2026-03-02' }),
    ).toBe(false);
  });

  it('bounds a row being added', () => {
    expect(keepsRecordedDate({ orderDate: '2026-03-02' })).toBe(false);
  });
});
