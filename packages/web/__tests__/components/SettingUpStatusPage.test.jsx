import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../helpers/render';

const { SettingUpStatusPage } = await import('../../app/components/StatusPage');

// spec: FSETUP#setting-up-screen
describe('SettingUpStatusPage', () => {
  afterEach(cleanup);

  it('tells the visitor the facility is being set up and asks them to wait', () => {
    renderElementWithTranslatedText(<SettingUpStatusPage />);
    expect(screen.getByText('Setting up this facility')).toBeTruthy();
    expect(screen.getByText(/loading this facility's data for the first time/)).toBeTruthy();
  });

  it('offers no way to log out', () => {
    renderElementWithTranslatedText(<SettingUpStatusPage />);
    expect(screen.queryByRole('button', { name: 'Log out' })).toBeNull();
  });
});
