import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { Avatar, CircularProgress } from '@material-ui/core';
import { useApi } from '../api';
import { useTranslation } from '../contexts/Translation';

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
    <b>Manual sync failed</b>
    <ErrorMessage>{errorMessage}</ErrorMessage>
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
  const { getTranslation } = useTranslation();

  const handleEvent = useCallback(
    async cb => {
      if (loading) return;
      setLoading(true);

      try {
        await cb();
      } catch (error) {
        toast.error(<Error errorMessage={error.message} />);
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
          getTranslation(
            "sidebar.avatar.notification.startingManualSync",
            "Starting manual sync..."
          )
        );
        await api.post(`sync/run`);
        toast.success(
          getTranslation(
            "sidebar.avatar.notification.manualSyncComplete",
            "Manual sync complete"
          )
        );
      });
      return;
    }

    if (event.ctrlKey) {
      handleEvent(async () => {
        const status = await api.get('/sync/status');
        const parts = [];
        if (status.lastCompletedAt === 0) {
          parts.push(<div>
            {getTranslation(
              "sidebar.avatar.notification.facilityNotSync",
              "Facility server has not synced since last restart."
            )}
          </div>);
        } else {
          const ago = formatDuration(new Date() - new Date(status.lastCompletedAt));
          const took = formatDuration(status.lastCompletedDurationMs);
          parts.push(<div>
            {getTranslation(
              "sidebar.avatar.notification.facilityLastSync",
              `Facility server last synced ${ago} ago (took ${took}).`,
              { ago, took }
            )}
          </div>);
        }
        if (status.isSyncRunning) {
          const duration = formatDuration(status.currentDuration);
          parts.push(<div>
            {getTranslation(
              "sidebar.notification.currentSyncRunning",
              `Current sync has been running for ${duration}.`,
              { duration }
            )}
          </div>);
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
    <StyledAvatar onClick={handleClick} {...props}>
      {loading ? <CustomCircularProgress size={20} /> : children}
    </StyledAvatar>
  );
};
