/*
 * NOTE: Currently this component simply holds the idle timer functionality
 * TODO: Build actual modals: WAITM-598 WAITM-599
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useIdleTimer } from 'react-idle-timer';
import Typography from '@material-ui/core/Typography';

import { useLocalisation } from '../contexts/Localisation';
import { useAuth } from '../contexts/Auth';
import { checkIsLoggedIn } from '../store/auth';

import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';

const IdleWarningModal = ({ open, duration, onConfirm, onClose }) => {
  return (
    <Modal title="Login timeout" open={open}>
      <Typography>
        {`Your login is about to expire due to inactivity. You will be logged out in ${duration} seconds.`}
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

  return (
    <IdleWarningModal
      open={showWarning}
      duration={warningPromptDuration}
      onConfirm={() => setShowWarning(false)}
      onClose={onLogout}
    />
  );
};
