/*
 * NOTE: Currently this component simply holds the idle timer functionality
 * TODO: Build actual modals: WAITM-598
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIdleTimer } from 'react-idle-timer';
import Typography from '@material-ui/core/Typography';

import { useLocalisation } from '../contexts/Localisation';
import { useAuth } from '../contexts/Auth';
import { checkIsLoggedIn } from '../store/auth';

import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';

const IdleWarningModal = ({ open, remainingDuration, onConfirm, onClose }) => {
  const [, updateState] = useState({});
  // Re-render modal on timer so countdown updates correctly
  useEffect(() => {
    const interval = setInterval(() => updateState({}), 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Modal title="Login timeout" open={open}>
      <Typography>
        {`Your login is about to expire due to inactivity. You will be logged out in ${Math.ceil(
          remainingDuration() / 1000,
        )} seconds.`}
      </Typography>
      <ModalActionRow
        confirmText="Stay logged in"
        cancelText="Logout"
        onConfirm={onConfirm}
        onCancel={onClose}
      />
    </Modal>
  );
};

export const UserActivityMonitor = () => {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const [showWarning, setShowWarning] = useState(false);
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
    setShowWarning(true);
  };

  const { getRemainingTime } = useIdleTimer({
    onIdle,
    onAction,
    onPrompt,
    events: ['keydown', 'mousedown', 'mousemove'],
    startOnMount: enabled,
    startManually: !enabled, // IdleTimer needs one of the start methods set to true
    timeout: timeoutDuration * 1000,
    promptTimeout: warningPromptDuration * 1000,
    throttle: refreshInterval * 1000,
  });

  return (
    <IdleWarningModal
      open={showWarning}
      remainingDuration={getRemainingTime}
      onConfirm={() => setShowWarning(false)}
      onClose={onLogout}
    />
  );
};
