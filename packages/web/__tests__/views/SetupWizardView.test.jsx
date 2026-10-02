import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SettingsContext } from '@tamanu/ui-components';
import { renderElementWithTranslatedText } from '../helpers/render';

const mocks = vi.hoisted(() => ({
  calls: [],
  post: null,
}));

vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useDispatch: () => async action => {
    mocks.calls.push(action);
    return true;
  },
}));
vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal()),
  useQueryClient: () => ({
    invalidateQueries: async key => void mocks.calls.push({ invalidated: key }),
  }),
}));
vi.mock('../../app/store/auth', async importOriginal => ({
  ...(await importOriginal()),
  login: (email, password) => ({ login: { email, password } }),
}));
vi.mock('../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useApi: () => ({ post: (...args) => mocks.post(...args) }),
}));
vi.mock('../../app/utils', async importOriginal => ({
  ...(await importOriginal()),
  notifySuccess: vi.fn(),
}));

const { SetupWizardView } = await import('../../app/views/SetupWizardView');

// spec: FSETUP#setup-wizard
describe('SetupWizardView', () => {
  afterEach(() => {
    cleanup();
    mocks.calls.length = 0;
  });

  const fillAndSubmit = async () => {
    const user = userEvent.setup();
    renderElementWithTranslatedText(
      <SettingsContext.Provider value={{ getSetting: () => undefined }}>
        <SetupWizardView />
      </SettingsContext.Provider>,
    );
    await user.type(screen.getByLabelText(/Central server URL/), 'https://central.example.com');
    await user.type(screen.getByLabelText(/Administrator username/), ' admin@example.com ');
    await user.type(screen.getByLabelText(/Administrator password/), 'sup3r-secret-pw');
    await user.type(screen.getByLabelText(/Facility ID/), 'facility-a');
    await user.click(screen.getByRole('button', { name: 'Connect and continue' }));
  };

  it('logs the administrator in before leaving the wizard', async () => {
    mocks.post = vi.fn(async () => ({ configured: true }));

    await fillAndSubmit();

    await waitFor(() => expect(mocks.calls).toHaveLength(2));
    expect(mocks.calls).toEqual([
      { login: { email: 'admin@example.com', password: 'sup3r-secret-pw' } },
      { invalidated: ['serverAlive'] },
    ]);
  });

  it('stays on the wizard without logging in when setup fails', async () => {
    mocks.post = vi.fn(async () => {
      throw new Error("Could not load this facility's data from the central server");
    });

    await fillAndSubmit();

    expect(
      await screen.findByText("Could not load this facility's data from the central server"),
    ).toBeTruthy();
    expect(mocks.calls).toEqual([]);
  });
});
