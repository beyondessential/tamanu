import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SERVER_TYPES } from '@tamanu/constants';

const state = vi.hoisted(() => ({
  serverStatus: null,
  isLoggedIn: false,
  isFacilitySelected: false,
}));

vi.mock('typeface-roboto', () => ({}));
vi.mock('react-redux', () => ({ useSelector: selector => selector() }));
vi.mock('react-router', () => ({ useLocation: () => ({ pathname: '/' }) }));
vi.mock('../../app/store/auth', () => ({
  checkIsLoggedIn: () => state.isLoggedIn,
  checkIsFacilitySelected: () => state.isFacilitySelected,
  getServerType: () => SERVER_TYPES.FACILITY,
}));
vi.mock('../../app/api/queries/useCheckServerAliveQuery', () => ({
  useCheckServerAliveQuery: () => ({ data: state.serverStatus, isLoading: false }),
}));
vi.mock('../../app/api/queries/useBrowserSupport', () => ({
  useBrowserSupport: () => ({ status: 'supported' }),
}));
vi.mock('../../app/utils/singleTab', () => ({ useSingleTab: () => true }));
vi.mock('../../app/views', () => ({
  LoginView: () => <div>Login view</div>,
  FacilitySelectionView: () => <div>Facility selection view</div>,
  SetupWizardView: () => <div>Setup wizard view</div>,
}));
vi.mock('../../app/components/StatusPage', () => ({
  LoadingStatusPage: () => <div>Loading</div>,
  UnavailableStatusPage: () => <div>Unavailable</div>,
  UnsupportedBrowserStatusPage: () => <div>Unsupported browser</div>,
  MobileStatusPage: () => <div>Mobile</div>,
  SingleTabStatusPage: () => <div>Single tab</div>,
  SettingUpStatusPage: () => <div>Setting up</div>,
}));

const { App } = await import('../../app/App');

// spec: FSETUP#setting-up-screen
describe('App while the facility is setting up', () => {
  afterEach(cleanup);

  const renderApp = ({ isSettingUp, isLoggedIn, isFacilitySelected = false }) => {
    Object.assign(state, {
      serverStatus: { ok: 'ok', setupRequired: false, isSettingUp },
      isLoggedIn,
      isFacilitySelected,
    });
    render(<App />);
  };

  it('holds a logged-out visitor on the setting-up screen ahead of login', () => {
    renderApp({ isSettingUp: true, isLoggedIn: false });
    expect(screen.getByText('Setting up')).toBeTruthy();
  });

  it('holds a browser that still holds a session on the setting-up screen', () => {
    renderApp({ isSettingUp: true, isLoggedIn: true, isFacilitySelected: true });
    expect(screen.getByText('Setting up')).toBeTruthy();
  });

  it('carries on to login once the first sync completes', () => {
    renderApp({ isSettingUp: false, isLoggedIn: false });
    expect(screen.getByText('Login view')).toBeTruthy();
  });
});
