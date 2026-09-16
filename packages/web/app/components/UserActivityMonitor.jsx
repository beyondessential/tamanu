/*
 * NOTE: Currently this component simply holds the idle timer functionality
 * TODO: Build actual modals: WAITM-598
 */

import Typography from '@material-ui/core/Typography';
import React, { useEffect, useState } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Modal, TranslatedText, useSettings } from '@tamanu/ui-components';
import { useAuth } from '../contexts/Auth';
import { checkIsLoggedIn } from '../store/auth';
import { ModalActionRow } from './ModalActionRow';

const WarningModalContainer = styled.div`
  padding-block: 2rem;
`;

const IdleWarningModal = ({ open, remainingDuration, onStayLoggedIn, onTimeout }) => {
  const [, updateState] = useState({});
  // Re-render modal on timer so countdown updates correctly
  useEffect(() => {
    const interval = setInterval(() => updateState({}), 500);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Modal
      title={<TranslatedText stringId="auth.modal.timeout.title" fallback="Login timeout" />}
      open={open}
      onClose={onStayLoggedIn}
      data-testid="modal-9qld"
    >
      <WarningModalContainer data-testid="warningmodalcontainer-qvo3">
        <Typography data-testid="typography-lqau">
          <TranslatedText
            stringId="auth.modal.timeout.warning"
            fallback="Your login is about to expire due to inactivity."
          />
        </Typography>
        <Typography data-testid="typography-d127">
          <TranslatedText
            stringId="auth.modal.timeout.countdown.prefix"
            fallback="You will be logged out in"
          />{' '}
          <b>{open ? Math.ceil(remainingDuration() / 1000) : '-'}</b>{' '}
          <TranslatedText stringId="auth.modal.timeout.countdown.seconds" fallback="seconds." />
        </Typography>
      </WarningModalContainer>
      <ModalActionRow
        confirmText={
          <TranslatedText stringId="auth.modal.timeout.stayLoggedIn" fallback="Stay logged in" />
        }
        cancelText={<TranslatedText stringId="auth.action.logout" fallback="Log out" />}
        onConfirm={onStayLoggedIn}
        onCancel={onTimeout}
        data-testid="modalactionrow-39hf"
      />
    </Modal>
  );
};

export const UserActivityMonitor = () => {
  const isUserLoggedIn = useSelector(checkIsLoggedIn);
  const [showWarning, setShowWarning] = useState(false);
  const { onTimeout, refreshToken } = useAuth();
  const { getSetting } = useSettings();

  // Can't fetch localisation prior to login so add defaults
  const {
    enabled = false,
    refreshInterval = 0,
    timeoutDuration = 0,
    warningPromptDuration = 0,
  } = getSetting('features.idleTimeout') || {};

  const onIdle = () => {
    // TODO: WAITM-598 Replace this full logout with a login modal
    onTimeout();
  };

  const onAction = () => {
    if (isUserLoggedIn) {
      refreshToken();
    }
  };

  const onPrompt = () => {
    setShowWarning(true);
  };

  const { reset, getRemainingTime } = useIdleTimer({
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
      onStayLoggedIn={() => {
        setShowWarning(false);
        reset();
      }}
      onTimeout={onTimeout}
      data-testid="idlewarningmodal-wvqz"
    />
  );
};
