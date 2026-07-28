import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, vi } from 'vitest';

import { MEDICATION_COLUMNS } from '../../app/forms/DischargeMedicationColumns';

const getTranslation = (_stringId, fallback) => fallback;
const getEnumTranslation = () => '';
const handleDiscontinueMedication = vi.fn();

const buildColumns = overrides =>
  MEDICATION_COLUMNS({
    getTranslation,
    getEnumTranslation,
    handleDiscontinueMedication,
    canUpdateMedication: true,
    ...overrides,
  });

const columnKeys = columns => columns.map(column => column.key);

const accessorFor = (columns, key) => columns.find(column => column.key === key).accessor;

/** Every `stringId` in an element tree, so a cell's copy can be asserted without a render. */
const collectStringIds = node => {
  if (Array.isArray(node)) return node.flatMap(collectStringIds);
  if (!node || typeof node !== 'object' || !node.props) return [];
  const { stringId, children } = node.props;
  return [...(stringId ? [stringId] : []), ...collectStringIds(children)];
};

const sensitiveMedicationRow = {
  id: 'medication-1',
  dispensingUnit: 'mg',
  referenceDrug: { isSensitive: true },
  medication: { referenceDrug: { isSensitive: true } },
};

// Regression guard for the "Other ongoing medication" discharge table call site, which once omitted
// the canWriteSensitiveMedication argument. Users with the SensitiveMedication write permission
// still had sensitive-drug quantity/repeats inputs disabled and the Discontinue action hidden in
// that table only, because canWriteSensitiveMedication resolved to undefined there.
describe('MEDICATION_COLUMNS sensitive medication permissions', () => {
  it('enables sensitive medication inputs and shows the discontinue action when permitted', () => {
    const columns = buildColumns({ canWriteSensitiveMedication: true });

    expect(accessorFor(columns, 'quantity')(sensitiveMedicationRow).props.disabled).toBe(false);
    expect(accessorFor(columns, 'repeats')(sensitiveMedicationRow).props.disabled).toBe(false);
    expect(accessorFor(columns, 'Discontinued')(sensitiveMedicationRow).type).not.toBe('div');
  });

  it.each([false, undefined])(
    'disables sensitive medication inputs and hides the discontinue action when canWriteSensitiveMedication is %s',
    canWriteSensitiveMedication => {
      const columns = buildColumns({ canWriteSensitiveMedication });

      expect(accessorFor(columns, 'quantity')(sensitiveMedicationRow).props.disabled).toBe(true);
      expect(accessorFor(columns, 'repeats')(sensitiveMedicationRow).props.disabled).toBe(true);
      expect(accessorFor(columns, 'Discontinued')(sensitiveMedicationRow).type).toBe('div');
    },
  );
});

describe('DischargeForm medication table call sites', () => {
  it('builds both medication tables from the same column options', () => {
    const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(
      path.join(currentDirectory, '../../app/forms/DischargeForm.jsx'),
      'utf8',
    );

    const callSiteArguments = [...source.matchAll(/MEDICATION_COLUMNS\(([^)]*)\)/g)].map(match =>
      match[1].trim(),
    );

    expect(callSiteArguments).toHaveLength(2);
    expect(new Set(callSiteArguments).size).toBe(1);
  });
});

describe('MEDICATION_COLUMNS pharmacy ordering', () => {
  it('omits the pharmacy columns when pharmacy orders are not enabled', () => {
    const keys = columnKeys(buildColumns({ isPharmacyOrderEnabled: false, showStockColumn: true }));

    expect(keys).not.toContain('sendToPharmacy');
    expect(keys).not.toContain('lastSent');
    expect(keys).not.toContain('stock');
  });

  it('shows send to pharmacy and last sent when pharmacy orders are enabled', () => {
    const keys = columnKeys(buildColumns({ isPharmacyOrderEnabled: true }));

    expect(keys).toContain('sendToPharmacy');
    expect(keys).toContain('lastSent');
  });

  it('omits the stock column when nothing on the discharge has a stock status', () => {
    const keys = columnKeys(buildColumns({ isPharmacyOrderEnabled: true, showStockColumn: false }));

    expect(keys).not.toContain('stock');
  });

  it('shows the stock column when a medication has a stock status', () => {
    const keys = columnKeys(buildColumns({ isPharmacyOrderEnabled: true, showStockColumn: true }));

    expect(keys).toContain('stock');
  });

  it('orders the pharmacy columns after Ongoing and before Discontinue', () => {
    const keys = columnKeys(buildColumns({ isPharmacyOrderEnabled: true, showStockColumn: true }));

    expect(keys).toEqual([
      'medication',
      'quantity',
      'repeats',
      'Ongoing',
      'sendToPharmacy',
      'lastSent',
      'stock',
      'Discontinued',
    ]);
  });
});

describe('MEDICATION_COLUMNS last sent', () => {
  const lastSentCell = row =>
    accessorFor(buildColumns({ isPharmacyOrderEnabled: true }), 'lastSent')(row);

  it('shows not applicable when the medication has never been sent to pharmacy', () => {
    expect(collectStringIds(lastSentCell({ lastOrderedAt: null }))).toContain(
      'general.fallback.notApplicable',
    );
  });

  it('shows an active request when the most recent request has not been dispensed', () => {
    const stringIds = collectStringIds(
      lastSentCell({ lastOrderedAt: '2024-10-22 09:30:00', isLastOrderDispensed: false }),
    );

    expect(stringIds).toContain('medication.pharmacyRequest.status.activeRequest');
    expect(stringIds).not.toContain('medication.pharmacyRequest.status.dispensed');
  });

  it('shows dispensed when the most recent request has been dispensed', () => {
    const stringIds = collectStringIds(
      lastSentCell({ lastOrderedAt: '2024-10-22 09:30:00', isLastOrderDispensed: true }),
    );

    expect(stringIds).toContain('medication.pharmacyRequest.status.dispensed');
    expect(stringIds).not.toContain('medication.pharmacyRequest.status.activeRequest');
  });
});

describe('MEDICATION_COLUMNS dispensing quantity', () => {
  it('requires a dispensing quantity of at least one', () => {
    const quantityField = accessorFor(buildColumns({ canWriteSensitiveMedication: true }), 'quantity')(
      { id: 'medication-1', dispensingUnit: 'mg', medication: {} },
    );

    expect(quantityField.props.required).toBe(true);
    expect(quantityField.props.min).toBe(1);
  });

  it('labels the column Dispensing qty', () => {
    const quantityColumn = buildColumns({}).find(column => column.key === 'quantity');

    expect(collectStringIds(quantityColumn.title)).toContain(
      'discharge.table.column.dispensingQuantity',
    );
  });
});
