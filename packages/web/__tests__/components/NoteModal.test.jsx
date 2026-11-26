import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createMemoryRouter, RouterProvider, useLocation, useNavigate } from 'react-router';
import { combineReducers, createStore } from 'redux';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TranslationContext } from '@tamanu/ui-components';

const api = vi.hoisted(() => ({ get: async () => ({ data: {} }) }));
vi.mock('../../app/api', () => ({ useApi: () => api }));
vi.mock('../../app/contexts/Auth', () => ({ useAuth: () => ({ currentUser: { id: 'user-1' } }) }));
vi.mock('../../app/forms/NoteForm', () => ({ NoteForm: () => <div>Note form</div> }));

import { NoteModal } from '../../app/components/NoteModal/NoteModal';
import { NoteModalProvider, useNoteModal } from '../../app/contexts/NoteModal';
import { authReducer, checkIsLoggedIn, idleTimeout } from '../../app/store/auth';

const ENCOUNTER_PATH = '/patients/all/patient-1/encounter/encounter-1';

// The login thunk needs a live server, so sign in with the action it settles on.
const loginSuccess = () => ({ type: 'LOGIN_SUCCESS', user: { id: 'user-1' } });

// Stands in for the patient routes: the note modal and its actions, then the auth provider's
// cleanup, which ends the session and redirects in the same tick.
const PatientArea = () => {
  const { openNoteModal } = useNoteModal();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return (
    <>
      <NoteModal />
      <button type="button" onClick={() => openNoteModal({ encounterId: 'encounter-1' })}>
        New note
      </button>
      <button
        type="button"
        onClick={() => {
          dispatch(idleTimeout());
          navigate('/');
        }}
      >
        Time out
      </button>
    </>
  );
};

// Stands in for App, which swaps the whole app for the login view while logged out.
const Layout = () => {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  return (
    <NoteModalProvider>
      <span data-testid="pathname">{pathname}</span>
      {isUserLoggedIn ? (
        <PatientArea />
      ) : (
        <button type="button" onClick={() => dispatch(loginSuccess())}>
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

const renderAtEncounter = () => {
  const store = createStore(combineReducers({ auth: authReducer }));
  store.dispatch(loginSuccess());
  const router = createMemoryRouter([{ path: '*', element: <Layout /> }], {
    initialEntries: [ENCOUNTER_PATH],
  });
  render(
    <Provider store={store}>
      <TranslationContext.Provider value={translationContext}>
        <RouterProvider router={router} />
      </TranslationContext.Provider>
    </Provider>,
  );
};

// The open dialog hides the rest of the page from assistive tech, so look past `aria-hidden`.
const click = name => fireEvent.click(screen.getByRole('button', { name, hidden: true }));

describe('NoteModal across an idle logout', () => {
  afterEach(cleanup);

  it('lets the logout redirect through and does not reopen the note at the next login', () => {
    renderAtEncounter();
    click('New note');
    expect(screen.getByText('Note form')).toBeTruthy();

    click('Time out');
    expect(screen.getByTestId('pathname').textContent).toBe('/');

    click('Log in');
    expect(screen.queryByText('Note form')).toBeNull();
    expect(screen.getByTestId('pathname').textContent).toBe('/');
  });
});
