/*
 * NOTE: Currently this component simply holds the idle timer functionality
 * TODO: Build actual modals: WAITM-598 WAITM-599
 */

import { useSelector } from 'react-redux';
import { useIdleTimer } from 'react-idle-timer';
import { useLocalisation } from '../contexts/Localisation';
import { useAuth } from '../contexts/Auth';
import { checkIsLoggedIn } from '../store/auth';

export const UserActivityMonitor = () => {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const { onLogout, refreshToken } = useAuth();
  const { getLocalisation } = useLocalisation();

  // Can't fetch localisation prior to login so add defaults
  const { enabled = false, timeoutDuration = 0, warningPromptDuration = 0, refreshInterval = 0 } =
    getLocalisation('features.idleTimeout') || {};

  const onIdle = () => {
    // TODO: WAITM-598 Replace this full logout with a login modal
    onLogout();
  };

  const onAction = () => {
    if (isUserLoggedIn) {
      refreshToken();
    }
  };

  const onPrompt = () => {
    // TODO: WAITM-599 Display idle warning modal
  };

  useIdleTimer({
    onIdle,
    onAction,
    onPrompt,
    events: ['keydown', 'mousedown', 'mousemove'],
    startOnMount: enabled,
    timeout: timeoutDuration * 1000,
    promptTimeout: warningPromptDuration * 1000,
    throttle: refreshInterval * 1000,
  });

  return null;
};
