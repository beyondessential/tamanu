import { ENCOUNTER_TYPE_PATIENT_STATUSES, type EncounterType } from '@tamanu/constants';
import { toFacilityDateTime } from '../dateTime';

export type EncounterRevision = {
  encounterType?: EncounterType | null;
  startDate?: string | null;
};

export type ConfiguredSection = {
  id: string;
  code: string;
  name: string;
};

export type InvoiceSection = {
  invoiceSectionId: string;
  code: string;
  name: string;
  /** Date-only. Null where the facility holds no record of the encounter entering this category. */
  startDate: string | null;
  /** Date-only, inclusive. Null while the period is still running. */
  endDate: string | null;
};

/**
 * The calendar date a stored datetime falls on where the facility is, not where the server is.
 * Stored datetimes are in the primary timezone, while the invoice's dates are read and picked in
 * facility-local terms, so a facility in another timezone would otherwise see a boundary a day out.
 */
const makeDateOnly =
  (primaryTimeZone?: string | null, facilityTimeZone?: string | null) =>
  (value?: string | null) => {
    if (!value) return null;
    if (!primaryTimeZone) return value.slice(0, 10);
    return toFacilityDateTime(value, primaryTimeZone, facilityTimeZone)?.slice(0, 10) ?? null;
  };

const categoryOf = (encounterType?: EncounterType | null) =>
  encounterType ? ENCOUNTER_TYPE_PATIENT_STATUSES[encounterType] : undefined;

/**
 * The periods an encounter spent in each category, oldest first. A new period opens only where the
 * category changes, so a move within one category (triage to active ED care) is not a boundary.
 *
 * The last period takes its start from the encounter's own start date rather than the revision
 * that opened it, so correcting an admission date afterwards moves the boundary with it.
 */
const buildPeriods = (
  encounter: EncounterRevision,
  revisions: EncounterRevision[],
  dateOnly: (value?: string | null) => string | null,
): { category: string; startDate: string | null; endDate: string | null }[] => {
  const periods: { category: string; startDate: string | null; endDate: string | null }[] = [];

  for (const revision of revisions) {
    const category = categoryOf(revision.encounterType);
    if (!category || category === periods.at(-1)?.category) continue;
    periods.push({ category, startDate: dateOnly(revision.startDate), endDate: null });
  }

  const currentCategory = categoryOf(encounter.encounterType);
  if (currentCategory) {
    if (currentCategory === periods.at(-1)?.category) {
      periods.at(-1)!.startDate = dateOnly(encounter.startDate);
    } else {
      periods.push({
        category: currentCategory,
        startDate: dateOnly(encounter.startDate),
        endDate: null,
      });
    }
  }

  // An admission corrected to before the category it follows would leave a period ending before it
  // began, which inverts the picker's bounds and makes nothing selectable. A boundary can move but
  // never back past the one before it.
  periods.forEach((period, index) => {
    const previousStart = periods[index - 1]?.startDate;
    if (previousStart && period.startDate && period.startDate < previousStart) {
      period.startDate = previousStart;
    }
  });

  // A move day belongs to both the period it ends and the one it starts, because an item carries
  // a date and not a time, so a period ends on the day the next one begins.
  periods.forEach((period, index) => {
    period.endDate = periods[index + 1]?.startDate ?? dateOnly(encounter.endDate ?? null);
  });

  return periods;
};

const earlierDate = (a: string | null, b: string | null) => {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
};

// A null end date is a period still running, which outlasts any dated end.
const laterDate = (a: string | null, b: string | null) => {
  if (!a || !b) return null;
  return a > b ? a : b;
};

/**
 * The sections an invoice shows, in the order it shows them: the encounter's periods in date
 * order, then any section its items carry that has no period of its own.
 *
 * A section with no period arises where the facility does not hold the record of the encounter
 * moving into that category — the changelog it is read from travels with a synced record and is
 * bounded by the sync window. Listing it unanchored keeps its items under their own heading
 * instead of dropping them into the unlabelled section at the foot of the invoice.
 */
export const buildInvoiceSections = ({
  encounter,
  revisions = [],
  configuredSections,
  itemSectionIds = [],
  primaryTimeZone = null,
  facilityTimeZone = null,
}: {
  encounter: EncounterRevision & { endDate?: string | null };
  revisions?: EncounterRevision[];
  configuredSections: ConfiguredSection[];
  itemSectionIds?: (string | null | undefined)[];
  primaryTimeZone?: string | null;
  facilityTimeZone?: string | null;
}): InvoiceSection[] => {
  const dateOnly = makeDateOnly(primaryTimeZone, facilityTimeZone);
  const sectionByCode = new Map(configuredSections.map(section => [section.code, section]));

  const sections: InvoiceSection[] = [];
  const sectionByConfiguredId = new Map<string, InvoiceSection>();
  for (const period of buildPeriods(encounter, revisions, dateOnly)) {
    const configured = sectionByCode.get(period.category);
    if (!configured) continue;

    // A category the encounter returns to after another one — a type set wrongly and corrected
    // back — gives two periods of the same category. An item records only its section and not
    // which period, so the two cannot be told apart, and listing both would show every item of
    // that category under each. They read as one section spanning both.
    const existing = sectionByConfiguredId.get(configured.id);
    if (existing) {
      existing.startDate = earlierDate(existing.startDate, period.startDate);
      existing.endDate = laterDate(existing.endDate, period.endDate);
      continue;
    }

    const section = {
      invoiceSectionId: configured.id,
      code: configured.code,
      name: configured.name,
      startDate: period.startDate,
      endDate: period.endDate,
    };
    sectionByConfiguredId.set(configured.id, section);
    sections.push(section);
  }

  const placed = new Set(sections.map(section => section.invoiceSectionId));
  for (const sectionId of itemSectionIds) {
    if (!sectionId || placed.has(sectionId)) continue;
    const configured = configuredSections.find(section => section.id === sectionId);
    if (!configured) continue;
    placed.add(sectionId);
    sections.push({
      invoiceSectionId: configured.id,
      code: configured.code,
      name: configured.name,
      startDate: null,
      endDate: null,
    });
  }

  return sections;
};

/**
 * A date range an item may carry, inclusive. Either bound is null where it could not be
 * established: the section has no period of its own and the encounter's span is unknown too.
 */
export type DatePeriod = { startDate: string | null; endDate: string | null };

/**
 * The encounter's own span as facility-local dates, which bounds any row carrying no section and
 * any section whose period the facility cannot establish. Built on the server, where the facility
 * timezone is known, and sent with the sections so the form never re-derives it.
 */
export const buildEncounterPeriod = ({
  encounter,
  primaryTimeZone = null,
  facilityTimeZone = null,
}: {
  encounter: { startDate?: string | null; endDate?: string | null };
  primaryTimeZone?: string | null;
  facilityTimeZone?: string | null;
}): { startDate: string | null; endDate: string | null } | null => {
  const dateOnly = makeDateOnly(primaryTimeZone, facilityTimeZone);
  const startDate = dateOnly(encounter?.startDate);
  if (!startDate) return null;
  return { startDate, endDate: dateOnly(encounter?.endDate) };
};

/**
 * The dates each section's items may carry, which the picker offers and the form's schema
 * enforces. A period still running ends today; one the facility cannot establish falls back to the
 * encounter's own span. The section keeps its raw period for display, so a section with no period
 * still shows its name alone.
 */
export const resolveSectionPeriods = (
  sections: InvoiceSection[] | null | undefined,
  encounterPeriod: { startDate: string | null; endDate: string | null } | null | undefined,
  today: string,
): Record<string, DatePeriod> =>
  Object.fromEntries(
    (sections ?? []).map(({ invoiceSectionId, startDate, endDate }) => [
      invoiceSectionId,
      {
        startDate: startDate ?? encounterPeriod?.startDate ?? null,
        endDate: endDate ?? encounterPeriod?.endDate ?? today,
      },
    ]),
  );

/** The encounter's span with its open end resolved to today, for rows carrying no section. */
export const resolveEncounterPeriod = (
  encounterPeriod: { startDate: string | null; endDate: string | null } | null | undefined,
  today: string,
): DatePeriod | null =>
  encounterPeriod?.startDate
    ? { startDate: encounterPeriod.startDate, endDate: encounterPeriod.endDate ?? today }
    : null;

/**
 * Whether an invoice has anything to tell apart, and so whether it is worth heading its items at
 * all. One section holding every charge needs no headers; one section alongside items carrying
 * none, or naming a section the invoice no longer lists, is two groups and does.
 */
export const isInvoiceSectioned = (
  sections: InvoiceSection[] | null | undefined,
  items: { invoiceSectionId?: string | null }[] | null | undefined,
): boolean => {
  const sectionCount = sections?.length ?? 0;
  if (sectionCount === 0) return false;
  if (sectionCount > 1) return true;

  const listed = new Set((sections ?? []).map(section => section.invoiceSectionId));
  return (items ?? []).some(
    item => !item.invoiceSectionId || !listed.has(item.invoiceSectionId),
  );
};

/**
 * Whether a row keeps the date it already holds rather than being held to its section's period.
 * An item saved before the admission time was corrected can sit outside its period, and the spec
 * leaves it at the date it holds; only a row being added or edited is bounded. The picker and the
 * form's schema both read this, so the two halves of the rule cannot disagree about one row.
 */
export const keepsRecordedDate = (row: {
  isExistingItem?: boolean;
  orderDate?: string | null;
  originalOrderDate?: string | null;
}): boolean => Boolean(row?.isExistingItem) && row?.orderDate === row?.originalOrderDate;
