import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../helpers/render';

const dispatch = vi.hoisted(() => vi.fn());
vi.mock('react-redux', async importOriginal => ({
  ...(await importOriginal()),
  useDispatch: () => dispatch,
}));

const { SettingUpStatusPage } = await import('../../app/components/StatusPage');
const { logout } = await import('../../app/store/auth');

// spec: FSETUP#setting-up-screen
describe('SettingUpStatusPage', () => {
  afterEach(cleanup);

  it('tells the user the facility is being set up and asks them to wait', () => {
    renderElementWithTranslatedText(<SettingUpStatusPage />);
    expect(screen.getByText('Setting up this facility')).toBeTruthy();
    expect(screen.getByText(/loading this facility's data for the first time/)).toBeTruthy();
  });

  it('logs the user out', () => {
    renderElementWithTranslatedText(<SettingUpStatusPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(dispatch).toHaveBeenCalledWith(logout());
  });
});
