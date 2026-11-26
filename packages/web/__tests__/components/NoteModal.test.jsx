import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TranslationContext } from '@tamanu/ui-components';

const api = vi.hoisted(() => {
  const loginInfo = { user: { id: 'user-1', email: 'user-1@example.com' }, permissions: [] };
  return {
    get: async () => ({ data: {} }),
    restoreSession: async () => loginInfo,
    login: async () => loginInfo,
    setUser: () => {},
    setAuthFailureHandler: () => {},
    setVersionIncompatibleHandler: () => {},
  };
});
vi.mock('../../app/api', () => ({ useApi: () => api }));
vi.mock('../../app/forms/NoteForm', () => ({ NoteForm: () => <div>Note form</div> }));

import { NoteModal } from '../../app/components/NoteModal/NoteModal';
import { AuthProvider, useAuth } from '../../app/contexts/Auth';
import { NoteModalProvider, useNoteModal } from '../../app/contexts/NoteModal';
import { createQueryClient } from '../helpers/render';

const ENCOUNTER_PATH = '/patients/all/patient-1/encounter/encounter-1';

// Stands in for the patient routes: the note modal and its actions. Timing out ends the session
// and redirects in the same tick.
const PatientArea = () => {
  const { openNoteModal } = useNoteModal();
  const { onTimeout } = useAuth();
  return (
    <>
      <NoteModal />
      <button type="button" onClick={() => openNoteModal({ encounterId: 'encounter-1' })}>
        New note
      </button>
      <button type="button" onClick={onTimeout}>
        Time out
      </button>
    </>
  );
};

// Stands in for App, which swaps the whole app for the login view while logged out.
const Layout = () => {
  const { currentUser, login } = useAuth();
  const { pathname } = useLocation();
  return (
    <NoteModalProvider>
      <span data-testid="pathname">{pathname}</span>
      {currentUser ? (
        <PatientArea />
      ) : (
        <button type="button" onClick={() => login('user-1@example.com', 'password')}>
          Log in
        </button>
      )}
    </NoteModalProvider>
  );
};

const translationContext = {
  getTranslation: (_stringId, fallback) => fallback,
  storedLanguage: 'en',
  translations: {},
};

// Signed in by restoring the stored session
const renderAtEncounter = async () => {
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <AuthProvider>
            <Layout />
          </AuthProvider>
        ),
      },
    ],
    { initialEntries: [ENCOUNTER_PATH] },
  );
  render(
    <QueryClientProvider client={createQueryClient()}>
      <TranslationContext.Provider value={translationContext}>
        <RouterProvider router={router} />
      </TranslationContext.Provider>
    </QueryClientProvider>,
  );
  await screen.findByRole('button', { name: 'New note' });
};

// The open dialog hides the rest of the page from assistive tech, so look past `aria-hidden`.
const click = name => fireEvent.click(screen.getByRole('button', { name, hidden: true }));

describe('NoteModal across an idle logout', () => {
  afterEach(cleanup);

  it('lets the logout redirect through and does not reopen the note at the next login', async () => {
    await renderAtEncounter();
    click('New note');
    expect(screen.getByText('Note form')).toBeTruthy();

    click('Time out');
    expect(screen.getByTestId('pathname').textContent).toBe('/');

    click('Log in');
    await screen.findByRole('button', { name: 'New note' });
    expect(screen.queryByText('Note form')).toBeNull();
    expect(screen.getByTestId('pathname').textContent).toBe('/');
  });
});
