import * as React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthContext, SettingsContext, DateTimeProvider } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers/render';
import { Table } from '../../../app/components';

const { notifySuccess } = vi.hoisted(() => ({ notifySuccess: vi.fn() }));
vi.mock('../../../app/utils', () => ({ notifySuccess }));

// eslint-disable-next-line import/first
import { COLUMNS, SystemErrors } from '../../../app/views/facility/SystemErrors';
// eslint-disable-next-line import/first
import { SendErrorLogModal } from '../../../app/views/facility/SendErrorLogModal';

const getSetting = key => (key === 'dateTimeLocale' ? 'en-AU' : undefined);

const withProviders = element => (
  <AuthContext.Provider value={{ primaryTimeZone: 'Australia/Brisbane' }}>
    <SettingsContext.Provider value={{ getSetting }}>
      <DateTimeProvider>{element}</DateTimeProvider>
    </SettingsContext.Provider>
  </AuthContext.Provider>
);

describe('SystemErrors', () => {
  beforeEach(() => {
    notifySuccess.mockClear();
  });

  it('lists the mock error rows with a plural send-log button', () => {
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    expect(screen.getByText('System errors')).toBeTruthy();
    expect(screen.getByText(/Something went wrong on the server\. Path: patient\/123/)).toBeTruthy();
    expect(
      screen.getByText(/Something went wrong on the server\. Path: labRequest\/all/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Something went wrong on the server\. Path: appointments\/outpatients/),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send error logs' })).toBeTruthy();
  });

  it('shows the empty state when there are no rows', () => {
    renderElementWithTranslatedText(
      withProviders(<Table data={[]} columns={COLUMNS} noDataMessage="No system errors to display" />),
    );

    expect(screen.getByText('No system errors to display')).toBeTruthy();
  });

  it('opens the modal with the reporting count and submits successfully', async () => {
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    fireEvent.click(screen.getByRole('button', { name: 'Send error logs' }));

    expect(screen.getByRole('heading', { name: 'Send error logs' })).toBeTruthy();
    expect(screen.getByTestId('send-error-log-subtitle').textContent).toBe(
      'Reporting 15 errors to the Tamanu support team.',
    );

    fireEvent.change(screen.getByLabelText('Additional information'), {
      target: { value: 'It keeps happening after login' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'clinician@example.org' },
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Send error logs' }).slice(-1)[0]);

    await waitFor(() => expect(notifySuccess).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Send error logs' })).toBeNull(),
    );
  });

  it('sorts rows by clicking the error message column header', () => {
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    const messageCellsOrder = () =>
      screen.getAllByText(/Something went wrong on the server\./).map(el => el.textContent);

    // Default: sorted by timestamp desc, so the most recent row (patient/123) leads.
    expect(messageCellsOrder()[0]).toMatch(/patient\/123/);

    // First click on a different column sorts desc by it; second click flips to asc,
    // which puts "appointments/..." first alphabetically — a change from the default.
    fireEvent.click(screen.getByText('Error message'));
    fireEvent.click(screen.getByText('Error message'));

    expect(messageCellsOrder()[0]).toMatch(/appointments\/outpatients/);
  });
});

describe('SendErrorLogModal singular/plural copy', () => {
  it('uses singular copy for exactly one error', () => {
    renderElementWithTranslatedText(
      withProviders(
        <SendErrorLogModal open onClose={() => {}} errors={[{ id: '1', timestamp: '', message: 'x' }]} />,
      ),
    );

    expect(screen.getByRole('heading', { name: 'Send error log' })).toBeTruthy();
    expect(screen.getByTestId('send-error-log-subtitle').textContent).toBe(
      'Reporting 1 error to the Tamanu support team.',
    );
  });
});
