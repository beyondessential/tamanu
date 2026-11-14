import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resolveEndpoint } from '@tamanu/api-client';
import { LoginView } from '../src/views/LoginView';
import { SelectProfileView } from '../src/views/SelectProfileView';
import { createFakeApi, fakePatient, renderPortal, stubTranslations } from './renderPortal';

const ANA = {
  portalUserId: 'portal-ana',
  displayId: 'KAMAKA01',
  firstName: 'Ana',
  lastName: 'Kamaka',
  dateOfBirth: '1990-05-15',
  sex: 'female',
};
const TUI = {
  portalUserId: 'portal-tui',
  displayId: 'KAMAKA02',
  firstName: 'Tui',
  lastName: 'Kamaka',
  dateOfBirth: '2018-02-03',
  sex: 'male',
};
const profilesOf = (...data: (typeof ANA)[]) => ({ email: 'kamaka.family@example.com', data });

const createProfilesApi = (responses: Record<string, unknown>) =>
  Object.assign(createFakeApi(responses), {
    setToken: vi.fn(async () => {}),
    tokenLogin: vi.fn(async () => ({ token: 'login-token', user: fakePatient() })),
  });

describe('Select profile', () => {
  it('lists each profile and switches to the one chosen', async () => {
    stubTranslations();
    const api = createProfilesApi({ me: fakePatient(), profiles: profilesOf(ANA, TUI) });
    api.post.mockResolvedValue({ token: 'tui-token' });
    renderPortal({ page: <SelectProfileView />, path: '/select-profile', api });

    expect(await screen.findByText('Ana Kamaka')).toBeTruthy();
    expect(screen.getByText(/ • M • KAMAKA02$/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Tui Kamaka/ }));

    expect(await screen.findByText('Dashboard')).toBeTruthy();
    expect(resolveEndpoint(api.post.mock.calls[0][0])).toBe('profiles/portal-tui/select');
    expect(api.setToken).toHaveBeenCalledWith('tui-token');
  });

  it('says so when the profile chosen cannot be opened', async () => {
    stubTranslations();
    const api = createProfilesApi({ me: fakePatient(), profiles: profilesOf(ANA, TUI) });
    api.post.mockRejectedValue(new Error('Profile not found'));
    renderPortal({ page: <SelectProfileView />, path: '/select-profile', api });

    await userEvent.click(await screen.findByRole('button', { name: /Tui Kamaka/ }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/couldn't be opened/);
    expect(api.setToken).not.toHaveBeenCalled();
    expect(screen.queryByText('Dashboard')).toBeNull();
  });
});

describe('Menu', () => {
  const openMenu = async (profiles: ReturnType<typeof profilesOf>) => {
    stubTranslations();
    const api = createProfilesApi({ me: fakePatient(), profiles });
    renderPortal({ page: <p>Records</p>, path: '/records', api });
    await userEvent.click(await screen.findByRole('button', { name: 'Open menu' }));
    expect(await screen.findByText('kamaka.family@example.com')).toBeTruthy();
    expect(screen.getByText('Ana Kamaka')).toBeTruthy();
  };

  it('offers to switch profile when the email has several', async () => {
    await openMenu(profilesOf(ANA, TUI));
    await userEvent.click(screen.getByRole('button', { name: 'Switch profile' }));
    expect(await screen.findByText('Select profile')).toBeTruthy();
  });

  it('leaves out switching profile when the email has one', async () => {
    await openMenu(profilesOf(ANA));
    expect(screen.queryByRole('button', { name: 'Switch profile' })).toBeNull();
  });
});

describe('Logging in', () => {
  const logIn = async (profiles: ReturnType<typeof profilesOf>) => {
    stubTranslations();
    const api = createProfilesApi({ profiles });
    renderPortal({ page: <LoginView />, path: '/login-submit', access: 'public', api });
    await userEvent.type(
      await screen.findByLabelText(/Email address/),
      'kamaka.family@example.com',
    );
    await userEvent.type(document.querySelector('input[name="verificationCode"]')!, '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(api.tokenLogin).toHaveBeenCalled());
  };

  it('asks which profile to open when the email has several', async () => {
    await logIn(profilesOf(ANA, TUI));
    expect(await screen.findByText('Select profile')).toBeTruthy();
  });

  it('goes straight to the dashboard when the email has one', async () => {
    await logIn(profilesOf(ANA));
    expect(await screen.findByText('Dashboard')).toBeTruthy();
  });
});
