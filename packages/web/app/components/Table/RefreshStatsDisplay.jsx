import { Box } from '@material-ui/core';
import React from 'react';
import { BodyText } from '../Typography';
import { TranslatedText } from '../Translation';
import { formatDistanceToNow, parseISO } from 'date-fns';
import styled from 'styled-components';

const SmallText = styled(BodyText)`
  font-size: 12px;
`;

export const RefreshStatsDisplay = ({ stats }) => {
  if (!stats) return null;
  const { lastRefreshed, schedule } = stats;
  return (
    <Box display="flex" flexDirection="column" alignItems="flex-end">
      <SmallText color="textTertiary">
        <TranslatedText
          stringId="table.refreshSchedule.lastUpdated"
          fallback="Last updated: :lastRefreshed"
          replacements={{
            lastRefreshed: formatDistanceToNow(parseISO(lastRefreshed), {
              addSuffix: 'ago',
            }),
          }}
        />
      </SmallText>
      <SmallText color="#B8B8B8">
        <TranslatedText
          stringId="table.refreshSchedule.schedule"
          fallback="Updated :schedule"
          replacements={{ schedule: schedule.toLowerCase() }}
        />
      </SmallText>
    </Box>
  );
};
