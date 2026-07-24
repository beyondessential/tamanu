import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, vi } from 'vitest';

import { MEDICATION_COLUMNS } from '../../app/forms/DischargeForm';

// Regression test for the "Other ongoing medication" discharge table call site in
// packages/web/app/forms/DischargeForm.jsx, which omitted the canWriteSensitiveMedication
// argument to MEDICATION_COLUMNS(...). Users with the SensitiveMedication write permission
// still had sensitive-drug quantity/repeats inputs disabled and the Discontinue action hidden
// in that table only, because canWriteSensitiveMedication resolved to undefined there.

const getTranslation = (_stringId, fallback) => fallback;
const getEnumTranslation = () => '';
const handleDiscontinueMedication = vi.fn();

const buildColumns = canWriteSensitiveMedication =>
  MEDICATION_COLUMNS(
    getTranslation,
    getEnumTranslation,
    handleDiscontinueMedication,
    true, // canUpdateMedication
    canWriteSensitiveMedication,
  );

const sensitiveMedicationRow = {
  id: 'medication-1',
  dispensingUnit: 'mg',
  referenceDrug: { isSensitive: true },
  medication: { referenceDrug: { isSensitive: true } },
};

describe('MEDICATION_COLUMNS', () => {
  it('enables sensitive medication inputs and shows the discontinue action when permitted', () => {
    const columns = buildColumns(true);

    const quantityField = columns.find(column => column.key === 'quantity').accessor(
      sensitiveMedicationRow,
    );
    const repeatsField = columns.find(column => column.key === 'repeats').accessor(
      sensitiveMedicationRow,
    );
    const discontinuedCell = columns.find(column => column.key === 'Discontinued').accessor(
      sensitiveMedicationRow,
    );

    expect(quantityField.props.disabled).toBe(false);
    expect(repeatsField.props.disabled).toBe(false);
    expect(discontinuedCell.type).not.toBe('div');
  });

  it.each([false, undefined])(
    'disables sensitive medication inputs and hides the discontinue action when canWriteSensitiveMedication is %s',
    canWriteSensitiveMedication => {
      const columns = buildColumns(canWriteSensitiveMedication);

      const quantityField = columns.find(column => column.key === 'quantity').accessor(
        sensitiveMedicationRow,
      );
      const repeatsField = columns.find(column => column.key === 'repeats').accessor(
        sensitiveMedicationRow,
      );
      const discontinuedCell = columns.find(column => column.key === 'Discontinued').accessor(
        sensitiveMedicationRow,
      );

      expect(quantityField.props.disabled).toBe(true);
      expect(repeatsField.props.disabled).toBe(true);
      expect(discontinuedCell.type).toBe('div');
    },
  );
});

describe('DischargeForm ongoing medication table call site', () => {
  it('passes canWriteSensitiveMedication to the "Other ongoing medication" MEDICATION_COLUMNS call', () => {
    const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
    const source = fs.readFileSync(
      path.join(currentDirectory, '../../app/forms/DischargeForm.jsx'),
      'utf8',
    );

    const ongoingMedicationHeadingIndex = source.indexOf('discharge.otherOngoingMedication');
    expect(ongoingMedicationHeadingIndex).toBeGreaterThan(-1);

    const sourceAfterHeading = source.slice(ongoingMedicationHeadingIndex);
    const callSiteMatch = sourceAfterHeading.match(/MEDICATION_COLUMNS\(([\s\S]*?)\)/);
    expect(callSiteMatch).not.toBeNull();

    expect(callSiteMatch[1]).toContain('canWriteSensitiveMedication');
  });
});
