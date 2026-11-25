import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderElementWithTranslatedText } from '../../helpers';
import { NoMatchScreen } from '../../../app/views/kiosk/screens/NoMatchScreen';

const kiosk = vi.hoisted(() => ({ dispatch: null }));

vi.mock('../../../app/views/kiosk/KioskSession', async importOriginal => ({
  ...(await importOriginal()),
  useKioskSession: () => ({
    session: { search: { lastName: 'Tuafa', day: '14', month: '3', year: '1986' } },
    dispatch: kiosk.dispatch,
  }),
}));

describe('Kiosk no match screen', () => {
  it('sends a patient whose details are correct to reception, then closes the session', async () => {
    kiosk.dispatch = vi.fn();
    const onEndSession = vi.fn();
    renderElementWithTranslatedText(<NoMatchScreen onEndSession={onEndSession} />);

    await userEvent.click(screen.getByRole('button', { name: 'My details are correct' }));

    expect(screen.getByText('Please go to reception')).toBeDefined();
    expect(onEndSession).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Close session' }));
    expect(onEndSession).toHaveBeenCalled();
  });

  it('lets the patient re-enter their details', async () => {
    kiosk.dispatch = vi.fn();
    renderElementWithTranslatedText(<NoMatchScreen onEndSession={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Re-enter details' }));

    expect(kiosk.dispatch).toHaveBeenCalledWith({ type: 'editSearch' });
  });
});
