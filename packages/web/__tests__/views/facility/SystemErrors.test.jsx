import * as React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import { AuthContext, SettingsContext, DateTimeProvider } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../helpers/render';
import { Table } from '../../../app/components';
import { systemErrorsReducer } from '../../../app/store/systemErrors';
import { COLUMNS, SystemErrors } from '../../../app/views/facility/SystemErrors';
import { SendErrorLogModal } from '../../../app/views/facility/SendErrorLogModal';

const { notifySuccess, notifyError, apiPost } = vi.hoisted(() => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  apiPost: vi.fn(),
}));
vi.mock('../../../app/utils', () => ({ notifySuccess, notifyError }));
vi.mock('../../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useApi: () => ({ post: apiPost }),
}));

const getSetting = key => (key === 'dateTimeLocale' ? 'en-AU' : undefined);

// SystemErrors reads its rows from state.systemErrors.errors via useSelector, so tests
// need their own store seeded with fixed, known rows — not the app's own seed data
// (see store/systemErrors.js), which would make these assertions dependent on it.
const hoursAgo = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const TEST_ERRORS = [
  {
    id: '1',
    timestamp: hoursAgo(0.2),
    message: 'patient/123: Unexpected token',
  },
  {
    id: '2',
    timestamp: hoursAgo(3),
    message: 'labRequest/all: Connection lost',
  },
  {
    id: '3',
    timestamp: hoursAgo(9),
    message: 'appointments/outpatients: relation does not exist',
  },
];

// Uses the real reducer (not a fixed-state stub) so the "submits successfully" test
// can assert the submitted rows actually disappear from state once dispatched.
// SystemErrors reads state.systemErrors.errors, so nest under that key like the app's
// own combineReducers does.
const createTestStore = errors =>
  createStore(
    (state, action) => ({
      systemErrors: systemErrorsReducer(state.systemErrors, action),
    }),
    { systemErrors: { errors } },
  );

const withProviders = (element, errors = TEST_ERRORS) => (
  <Provider store={createTestStore(errors)}>
    <AuthContext.Provider value={{ primaryTimeZone: 'Australia/Brisbane' }}>
      <SettingsContext.Provider value={{ getSetting }}>
        <DateTimeProvider>{element}</DateTimeProvider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  </Provider>
);

describe('SystemErrors', () => {
  beforeEach(() => {
    notifySuccess.mockClear();
    notifyError.mockClear();
    apiPost.mockReset();
  });

  it('lists the mock error rows with a plural send-log button', () => {
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    expect(screen.getByText('System errors')).toBeTruthy();
    expect(screen.getByText('patient/123: Unexpected token')).toBeTruthy();
    expect(screen.getByText('labRequest/all: Connection lost')).toBeTruthy();
    expect(screen.getByText('appointments/outpatients: relation does not exist')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send error logs' })).toBeTruthy();
  });

  it('shows the empty state when there are no rows', () => {
    renderElementWithTranslatedText(
      withProviders(<Table data={[]} columns={COLUMNS} noDataMessage="No system errors to display" />),
    );

    expect(screen.getByText('No system errors to display')).toBeTruthy();
  });

  it('disables the send-log button when there are no errors, and does not open the modal', () => {
    renderElementWithTranslatedText(withProviders(<SystemErrors />, []));

    const sendLogButton = screen.getByRole('button', { name: 'Send error logs' });
    expect(sendLogButton.disabled).toBe(true);

    fireEvent.click(sendLogButton);
    expect(screen.queryByRole('heading', { name: 'Send error logs' })).toBeNull();
  });

  it('opens the modal with the reporting count and submits successfully, removing the submitted rows', async () => {
    apiPost.mockResolvedValueOnce({ ok: 'ok' });
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    fireEvent.click(screen.getByRole('button', { name: 'Send error logs' }));

    expect(screen.getByRole('heading', { name: 'Send error logs' })).toBeTruthy();
    expect(screen.getByTestId('send-error-log-subtitle').textContent).toBe(
      'Reporting 3 errors to the Tamanu support team.',
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

    expect(apiPost).toHaveBeenCalledWith(
      'systemErrorReport',
      expect.objectContaining({
        additionalInformation: 'It keeps happening after login',
        email: 'clinician@example.org',
        // isRead flips true once the view mounts (see markSystemErrorsRead), so
        // compare against that rather than the raw TEST_ERRORS fixture.
        errors: TEST_ERRORS.map(error => ({ ...error, isRead: true })),
      }),
    );

    // The submitted rows are removed from the table once sent.
    expect(screen.queryByText('patient/123: Unexpected token')).toBeNull();
    expect(screen.getByText('No system errors to display')).toBeTruthy();
  });

  it('keeps the modal open and the rows intact if sending fails', async () => {
    apiPost.mockRejectedValueOnce(new Error('Network error'));
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    fireEvent.click(screen.getByRole('button', { name: 'Send error logs' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Send error logs' }).slice(-1)[0]);

    await waitFor(() => expect(notifyError).toHaveBeenCalledTimes(1));

    expect(screen.getByRole('heading', { name: 'Send error logs' })).toBeTruthy();
    expect(screen.getByText('patient/123: Unexpected token')).toBeTruthy();
    expect(notifySuccess).not.toHaveBeenCalled();
  });

  it('purges errors older than 24 hours on mount, keeping fresher ones', () => {
    const staleError = {
      id: 'stale',
      timestamp: hoursAgo(25),
      message: 'old/stale: Ancient failure',
    };
    renderElementWithTranslatedText(withProviders(<SystemErrors />, [...TEST_ERRORS, staleError]));

    expect(screen.queryByText('old/stale: Ancient failure')).toBeNull();
    expect(screen.getByText('patient/123: Unexpected token')).toBeTruthy();
  });

  it('sorts rows by clicking the error message column header', () => {
    renderElementWithTranslatedText(withProviders(<SystemErrors />));

    const messageCellsOrder = () =>
      screen.getAllByText(/Unexpected token|Connection lost|relation does not exist/).map(el => el.textContent);

    // Default: sorted by timestamp desc, so the most recent row (patient/123) leads.
    expect(messageCellsOrder()[0]).toBe('patient/123: Unexpected token');

    // First click on a different column sorts desc by it; second click flips to asc,
    // which puts "appointments/..." first alphabetically — a change from the default.
    fireEvent.click(screen.getByText('Error message'));
    fireEvent.click(screen.getByText('Error message'));

    expect(messageCellsOrder()[0]).toBe('appointments/outpatients: relation does not exist');
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
