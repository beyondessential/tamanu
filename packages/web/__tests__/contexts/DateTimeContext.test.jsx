import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';
import {
  AuthContext,
  DateTimeProvider,
  SettingsContext,
  useDateTime,
} from '@tamanu/ui-components';

const STORED_DATE = '2024-04-12 15:30:00';

const ShowDate = () => {
  const { formatShort, locale } = useDateTime();
  return (
    <>
      <span data-testid="formatted">{formatShort(STORED_DATE)}</span>
      <span data-testid="locale">{locale}</span>
    </>
  );
};

const renderWithSettings = settings =>
  render(
    <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
      <SettingsContext.Provider value={{ getSetting: key => settings[key] }}>
        <DateTimeProvider>
          <ShowDate />
        </DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>,
  );

describe('DateTimeProvider locale resolution', () => {
  it('formats with the dateTimeLocale setting when set', () => {
    renderWithSettings({ dateTimeLocale: 'en-US' });
    expect(screen.getByTestId('formatted').textContent).toBe('04/12/2024');
    expect(screen.getByTestId('locale').textContent).toBe('en-US');
  });

  it('falls back to the runtime locale when the setting is unset', () => {
    renderWithSettings({});
    const runtimeDefault = Intl.DateTimeFormat().resolvedOptions().locale;
    expect(screen.getByTestId('locale').textContent).toBe(runtimeDefault);
    expect(screen.getByTestId('formatted').textContent).toBe(
      new Intl.DateTimeFormat(runtimeDefault, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(2024, 3, 12)),
    );
  });
});
