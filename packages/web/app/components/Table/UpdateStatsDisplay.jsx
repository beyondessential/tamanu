import { Box } from '@material-ui/core';
import React, { useCallback, useEffect, useState } from 'react';
import { BodyText } from '../Typography';
import { TranslatedText } from '../Translation';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { useParsedCronExpression } from '../../utils/useParsedCronExpression';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from '../../contexts/Translation';

const SmallText = styled(BodyText)`
  font-size: 10px;
`;

const SoftText = styled(SmallText)`
  color: ${Colors.softText};
`;

const ErrorText = styled(SmallText)`
  color: ${({ theme }) => theme.palette.error.main};
`;

const StatsError = () => (
  <ErrorText color="error">
    <TranslatedText
      stringId="table.refreshSchedule.error"
      fallback="Error loading stats"
      data-test-id='translatedtext-7wgi' />
  </ErrorText>
);

export const UpdateStatsDisplay = ({
  stats: { schedule, lastRefreshed },
  error,
  recalculateDistanceFromNowIntervalMs = 1000 * 60,
}) => {
  const parsedSchedule = useParsedCronExpression(schedule);
  const [lastUpdated, setLastUpdated] = useState();
  const { getTranslation } = useTranslation();

  const dateAsDistanceToNow = useCallback(
    date =>
      formatDistanceToNow(new Date(date), {
        addSuffix: getTranslation('schedule.distanceFromNow.suffix', 'ago'),
      }),
    [getTranslation],
  );

  const handleRefreshLastUpdated = useCallback(() => {
    setLastUpdated(dateAsDistanceToNow(lastRefreshed));
  }, [dateAsDistanceToNow, lastRefreshed]);

  // Update the distance from now text every minute
  useEffect(() => {
    if (!lastRefreshed) return;
    const interval = setInterval(handleRefreshLastUpdated, recalculateDistanceFromNowIntervalMs);
    handleRefreshLastUpdated();
    return () => clearInterval(interval);
  }, [handleRefreshLastUpdated, lastRefreshed, recalculateDistanceFromNowIntervalMs]);

  if (!lastUpdated) return null;
  return (
    <Box display="flex" flexDirection="column" alignItems="flex-end">
      {error ? (
        <StatsError />
      ) : (
        <>
          <SmallText color="textTertiary">
            <TranslatedText
              stringId="table.refreshSchedule.lastUpdated"
              fallback="Last updated: :lastUpdated"
              replacements={{ lastUpdated }}
              data-test-id='translatedtext-rl9t' />
          </SmallText>
          <SoftText>
            <TranslatedText
              stringId="table.refreshSchedule.schedule"
              fallback="Updated :schedule"
              replacements={{ schedule: parsedSchedule.toLowerCase() }}
              data-test-id='translatedtext-ttt1' />
          </SoftText>
        </>
      )}
    </Box>
  );
};
