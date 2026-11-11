import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';

import { SettingsContext } from '@tamanu/ui-components';
import {
  COLUMN_KEYS,
  PharmacyOrderMedicationTable,
} from '../../../app/components/Medication/PharmacyOrderMedicationTable';
import { TranslationProvider } from '../../../app/contexts/Translation';
import { createStubTheme, createTranslationContextWithReplacements } from '../../helpers';

const buildRow = overrides => ({
  id: 'prescription-1',
  medication: {
    id: 'drug-aluminium600',
    name: 'Aluminium 600mg Tablets',
    referenceDrug: { doseMin: '1', doseMax: '2', dispensingQuantityMax: 100 },
  },
  doseAmount: '10',
  dosingUnit: 'Tablet',
  isVariableDose: false,
  quantity: 500,
  dispensingUnit: 'Tablet',
  selected: false,
  hasError: false,
  onChange: () => {},
  ...overrides,
});

const renderTable = rows =>
  render(
    <ThemeProvider theme={createStubTheme()}>
      <SettingsContext.Provider value={{ getSetting: () => undefined }}>
        <TranslationProvider value={createTranslationContextWithReplacements()}>
          <PharmacyOrderMedicationTable
            data={rows}
            columnsToInclude={[COLUMN_KEYS.MEDICATION, COLUMN_KEYS.DOSE, COLUMN_KEYS.QUANTITY]}
            cellOnChange={() => {}}
          />
        </TranslationProvider>
      </SettingsContext.Provider>
    </ThemeProvider>,
  );

const getRow = medicationName => screen.getByText(medicationName).closest('tr');

// spec: DQLIM#sending-to-pharmacy
describe('PharmacyOrderMedicationTable dose and quantity limits', () => {
  it('flags the dose and the quantity on a row, whether or not it is selected', () => {
    renderTable([buildRow()]);

    const row = within(getRow('Aluminium 600mg Tablets'));
    expect(row.getByText('Above expected max of 2 tablets')).toBeTruthy();
    expect(row.getByText('Above expected max of 100 tablets')).toBeTruthy();
  });

  it('shows no warning for values in range, or for a variable dose', () => {
    renderTable([
      buildRow({ doseAmount: '2', quantity: 100 }),
      buildRow({
        id: 'prescription-2',
        medication: { ...buildRow().medication, id: 'drug-2', name: 'Variable Drug' },
        doseAmount: null,
        isVariableDose: true,
        quantity: 30,
      }),
    ]);

    expect(screen.queryByTestId('medication-limit-warning')).toBeNull();
  });

  it('shows the required error rather than the quantity warning once submitted empty', () => {
    renderTable([buildRow({ doseAmount: '1', quantity: '', hasError: true, selected: true })]);

    const row = within(getRow('Aluminium 600mg Tablets'));
    expect(row.getByText('*Required')).toBeTruthy();
    expect(row.queryByTestId('medication-limit-warning')).toBeNull();
  });
});
