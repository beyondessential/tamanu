import { describe, it, expect } from 'vitest';
import { buildInvoiceFormSchema } from '../../../app/features/Invoice/InvoiceForm/invoiceFormSchema';

// A section's period is the only thing stopping an item being given a date belonging to another
// section, because an item carries a date and not a time.
const EMERGENCY = 'section-emergency';
const INPATIENT = 'section-inpatient';

const SECTION_PERIODS = {
  [EMERGENCY]: { startDate: '2026-03-01', endDate: '2026-03-04' },
  [INPATIENT]: { startDate: '2026-03-04', endDate: '2026-03-20' },
};

const formatDate = date => date;

const item = overrides => ({
  orderDate: '2026-03-02',
  productId: 'product-1',
  orderedByUserId: 'user-1',
  quantity: 1,
  invoiceSectionId: EMERGENCY,
  ...overrides,
});

const validate = (invoiceItems, periods = SECTION_PERIODS, encounterPeriod = null) =>
  buildInvoiceFormSchema(periods, encounterPeriod, formatDate).validateSync({ invoiceItems });

const errorFor = (invoiceItems, periods, encounterPeriod) => {
  try {
    validate(invoiceItems, periods, encounterPeriod);
    return null;
  } catch (error) {
    return error;
  }
};

describe('buildInvoiceFormSchema date limits', () => {
  it('accepts a date inside the section period', () => {
    expect(() => validate([item()])).not.toThrow();
  });

  it('accepts the first and last day of the period', () => {
    expect(() => validate([item({ orderDate: '2026-03-01' })])).not.toThrow();
    expect(() => validate([item({ orderDate: '2026-03-04' })])).not.toThrow();
  });

  it('rejects a date before the section period', () => {
    expect(errorFor([item({ orderDate: '2026-02-27' })])).not.toBeNull();
  });

  it('rejects a date after the section period, which belongs to the next section', () => {
    expect(errorFor([item({ orderDate: '2026-03-06' })])).not.toBeNull();
  });

  it('names the first and last allowed dates in the message', () => {
    const error = errorFor([item({ orderDate: '2026-03-06' })]);
    expect(error.message.props.replacements).toEqual({
      firstDate: '2026-03-01',
      lastDate: '2026-03-04',
    });
  });

  it("limits a still-running section at its start and at today's date", () => {
    // resolveSectionPeriods ends a running period at today, so the current section is bounded at
    // both ends: an item cannot be backdated into the section before it.
    const running = { [INPATIENT]: { startDate: '2026-03-04', endDate: '2026-03-20' } };
    expect(() =>
      validate([item({ invoiceSectionId: INPATIENT, orderDate: '2026-03-20' })], running),
    ).not.toThrow();
    expect(
      errorFor([item({ invoiceSectionId: INPATIENT, orderDate: '2026-03-02' })], running),
    ).not.toBeNull();
    expect(
      errorFor([item({ invoiceSectionId: INPATIENT, orderDate: '2026-03-21' })], running),
    ).not.toBeNull();
  });

  it('places no limit on a section with no period at all', () => {
    expect(() =>
      validate([item({ orderDate: '2020-01-01' })], { [EMERGENCY]: { startDate: null, endDate: null } }),
    ).not.toThrow();
  });

  it("holds an unsectioned row to the encounter's own range", () => {
    // The general invoicing criterion applies to every item, not only a sectioned one.
    const encounterPeriod = { startDate: '2026-03-01', endDate: '2026-03-20' };
    expect(() =>
      validate([item({ invoiceSectionId: null, orderDate: '2026-03-10' })], {}, encounterPeriod),
    ).not.toThrow();
    expect(
      errorFor([item({ invoiceSectionId: null, orderDate: '2020-01-01' })], {}, encounterPeriod),
    ).not.toBeNull();
  });

  it('places no limit where even the encounter range is unknown', () => {
    expect(() =>
      validate([item({ invoiceSectionId: null, orderDate: '2020-01-01' })], {}, null),
    ).not.toThrow();
  });

  it('leaves an already-saved item at the date it holds', () => {
    // The admission time was corrected after the item was added, so its date now sits outside the
    // section. The spec says it stays as it is, and an unrelated edit must not be blocked by it.
    expect(() =>
      validate([
        item({ orderDate: '2026-02-20', isExistingItem: true, originalOrderDate: '2026-02-20' }),
      ]),
    ).not.toThrow();
  });

  it('holds an already-saved item to the period once its date is edited', () => {
    expect(
      errorFor([
        item({ orderDate: '2026-02-20', isExistingItem: true, originalOrderDate: '2026-03-02' }),
      ]),
    ).not.toBeNull();
  });

  it('still requires a date', () => {
    expect(errorFor([item({ orderDate: '' })])).not.toBeNull();
  });
});


