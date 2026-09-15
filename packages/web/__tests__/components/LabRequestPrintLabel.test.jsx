import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';

import { LabRequestPrintLabel } from '../../app/components/PatientPrinting/printouts/LabRequestPrintLabel';

const PRIMARY_TIME_ZONE = 'Pacific/Auckland';

const LABEL_DATA = {
  patientName: 'Jack White',
  patientDateOfBirth: '1990-01-01',
  patientId: '9S303JSSK29',
  requestId: 'LCZSV5P',
  date: '2026-01-01 09:23:00',
  collectedBy: 'Catherine Jennings',
};

const renderLabel = (data = LABEL_DATA) =>
  render(
    <AuthContext.Provider value={{ primaryTimeZone: PRIMARY_TIME_ZONE }}>
      <SettingsContext.Provider value={{ getSetting: key => ({ dateTimeLocale: 'en-AU' }[key]) }}>
        <DateTimeProvider>
          <div data-testid="label">
            <LabRequestPrintLabel data={data} />
          </div>
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );

const labelText = () => screen.getByTestId('label').textContent;

describe('LabRequestPrintLabel', () => {
  it('shows the standard label fields', () => {
    renderLabel();
    const text = labelText();
    expect(text).toContain('Jack White');
    expect(text).toContain('9S303JSSK29');
    expect(text).toContain('Catherine Jennings');
    expect(text).toContain('Request ID');
    expect(text).toContain('Collected by');
  });

  it('shows the date of birth with age in years', () => {
    renderLabel();
    expect(labelText()).toMatch(/01\/01\/1990 \(\d+ years\)/);
  });

  it('omits age when the date of birth is unknown', () => {
    renderLabel({ ...LABEL_DATA, patientDateOfBirth: null });
    const text = labelText();
    expect(text).not.toContain('years');
    expect(text).not.toContain('NaN');
  });

  it('shows the date collected with date and time', () => {
    renderLabel();
    expect(labelText()).toContain('01/01/2026');
    expect(labelText()).toMatch(/9:23\s?am/i);
  });

  it('shows the request id', () => {
    // The barcode encodes the same value, but react-barcode needs layout measurement that jsdom
    // does not provide, so the printed barcode is covered by manual label-printer testing.
    renderLabel();
    expect(labelText()).toContain('LCZSV5P');
  });

  it('does not show lab category or specimen type', () => {
    renderLabel();
    const text = labelText();
    expect(text).not.toContain('Lab category');
    expect(text).not.toContain('Specimen type');
  });
});
