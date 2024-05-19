import { Box } from '@material-ui/core';
import React from 'react';
import { BodyText } from '../Typography';
import { TranslatedText } from '../Translation';
import styled from 'styled-components';

const SmallText = styled(BodyText)`
  font-size: 12px;
`;

const ErrorText = styled(SmallText)`
  color: ${({ theme }) => theme.palette.error.main};
`;

export const RefreshStatsDisplay = ({ stats, error }) => {
  if (!stats) return null;
  const { lastUpdated, schedule } = stats;
  if (error) {
    return (
      <Box display="flex" flexDirection="column" alignItems="flex-end">
        <ErrorText color="error">
          <TranslatedText
            stringId="table.refreshSchedule.error"
            fallback="Error loading refresh stats"
          />
        </ErrorText>
      </Box>
    );
  }
  return (
    <Box display="flex" flexDirection="column" alignItems="flex-end">
      {error ? (
        <ErrorText color="error">
          <TranslatedText stringId="table.refreshSchedule.error" fallback="Error loading stats" />
        </ErrorText>
      ) : (
        <>
          <SmallText color="textTertiary">
            <TranslatedText
              stringId="table.refreshSchedule.lastUpdated"
              fallback="Last updated: :lastUpdated"
              replacements={{ lastUpdated }}
            />
          </SmallText>
          <SmallText color="#B8B8B8">
            <TranslatedText
              stringId="table.refreshSchedule.schedule"
              fallback="Updated :schedule"
              replacements={{ schedule: schedule.toLowerCase() }}
            />
          </SmallText>
        </>
      )}
    </Box>
  );
};
