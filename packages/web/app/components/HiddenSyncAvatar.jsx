import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Avatar, CircularProgress } from '@mui/material';
import { useApi } from '../api';
import { TranslatedText } from './Translation/TranslatedText';

const StyledAvatar = styled(Avatar)`
  background: #e7b091;
  font-weight: 500;
  font-size: 16px;
  margin-right: 12px;
  margin-top: 5px;
  text-transform: uppercase;
  position: relative;
`;

const ErrorMessage = styled.div`
  word-break: break-word;
`;

const CustomCircularProgress = styled(CircularProgress)`
  color: #ffffff;
`;

const Error = ({ errorMessage }) => (
  <div>
    <b>
      <TranslatedText
        stringId="sidebar.avatar.notification.manualSyncFailed"
        fallback="Manual sync failed"
        data-testid="translatedtext-mkoe"
      />
    </b>
    <ErrorMessage data-testid="errormessage-xwdx">{errorMessage}</ErrorMessage>
  </div>
);

function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const components = [];

  if (hours) components.push(`${hours}h`);
  if (minutes) components.push(`${minutes}m`);
  if (remainingSeconds) components.push(`${remainingSeconds}s`);

  return components.join(' ') || '0s';
}

export const HiddenSyncAvatar = ({ children, onClick, ...props }) => {
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleEvent = useCallback(
    async cb => {
      if (loading) return;
      setLoading(true);

      try {
        await cb();
      } catch (error) {
        toast.error(<Error errorMessage={error.message} data-testid="error-20o6" />);
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const handleClick = async event => {
    if (event.shiftKey) {
      handleEvent(async () => {
        toast.info(
          <TranslatedText
            stringId="sidebar.avatar.notification.startingManualSync"
            fallback="Starting manual sync..."
            data-testid="translatedtext-9n4z"
          />,
        );
        const { message } = await api.post(`sync/run`);
        toast.success(
          <TranslatedText
            stringId="sidebar.avatar.notification.manualSync"
            fallback={`Manual sync: ${message}`}
            replacements={{ message }}
            data-testid="translatedtext-d5we"
          />,
        );
      });
      return;
    }

    if (event.ctrlKey || event.altKey) {
      handleEvent(async () => {
        const status = await api.get('/sync/status');
        const parts = [];
        if (status.lastCompletedAt === 0) {
          parts.push(
            <div>
              <TranslatedText
                stringId="sidebar.avatar.notification.facilityNotSync"
                fallback="Facility server has not synced since last restart."
                data-testid="translatedtext-7nk1"
              />
            </div>,
          );
        } else {
          const ago = formatDuration(status.lastCompletedAgo);
          const took = formatDuration(status.lastCompletedDurationMs);
          parts.push(
            <div>
              <TranslatedText
                stringId="sidebar.avatar.notification.facilityLastSync"
                fallback={`Facility server last synced ${ago} ago (took ${took}).`}
                replacements={{ ago, took }}
                data-testid="translatedtext-pcrn"
              />
            </div>,
          );
        }
        if (status.isSyncRunning) {
          const duration = formatDuration(status.currentDuration);
          parts.push(
            <div>
              <TranslatedText
                stringId="sidebar.notification.currentSyncRunning"
                fallback={`Current sync has been running for ${duration}.`}
                replacements={{ duration }}
                data-testid="translatedtext-ln10"
              />
            </div>,
          );
        }
        toast.info(<div>{parts}</div>);
      });
      return;
    }

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <StyledAvatar onClick={handleClick} {...props} data-testid="styledavatar-uo6d">
      {loading ? (
        <CustomCircularProgress size={20} data-testid="customcircularprogress-eggw" />
      ) : (
        children
      )}
    </StyledAvatar>
  );
};
