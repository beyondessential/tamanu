/*
 * NOTE: Currently this component simply holds the idle timer functionality
 * TODO: Build actual modals: WAITM-598
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useIdleTimer } from 'react-idle-timer';
import Typography from '@material-ui/core/Typography';
import styled from 'styled-components';

import { useSettings } from '../contexts/Settings';
import { useAuth } from '../contexts/Auth';
import { checkIsLoggedIn } from '../store/auth';
import { TranslatedText } from './Translation/TranslatedText';

import { ModalActionRow } from './ModalActionRow';
import { Modal } from './Modal';

const WarningModalContainer = styled.div`
  padding-top: 2rem;
  padding-bottom: 2rem;
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
      title={
        <TranslatedText
          stringId="auth.modal.timeout.title"
          fallback="Login timeout"
          data-testid="translatedtext-timeout-title"
        />
      }
      open={open}
      onClose={onStayLoggedIn}
      data-testid="modal-9qld"
    >
      <WarningModalContainer data-testid="warningmodalcontainer-qvo3">
        <Typography data-testid="typography-lqau">
          <TranslatedText
            stringId="auth.modal.timeout.warning"
            fallback="Your login is about to expire due to inactivity."
            data-testid="translatedtext-timeout-warning"
          />
        </Typography>
        <Typography data-testid="typography-d127">
          <TranslatedText
            stringId="auth.modal.timeout.countdown.prefix"
            fallback="You will be logged out in"
            data-testid="translatedtext-timeout-prefix"
          />{' '}
          <b>{open ? Math.ceil(remainingDuration() / 1000) : '-'}</b>{' '}
          <TranslatedText
            stringId="auth.modal.timeout.countdown.seconds"
            fallback="seconds."
            data-testid="translatedtext-timeout-suffix"
          />
        </Typography>
      </WarningModalContainer>
      <ModalActionRow
        confirmText={
          <TranslatedText
            stringId="auth.modal.timeout.stayLoggedIn"
            fallback="Stay logged in"
            data-testid="translatedtext-stay-logged-in"
          />
        }
        cancelText={
          <TranslatedText
            stringId="auth.action.logout"
            fallback="Log out"
            data-testid="translatedtext-logout"
          />
        }
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
  const { enabled = false, timeoutDuration = 0, warningPromptDuration = 0, refreshInterval = 0 } =
    getSetting('features.idleTimeout') || {};

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
