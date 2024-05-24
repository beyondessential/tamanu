import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { useAutoUpdatingQuery } from './useAutoUpdatingQuery';
import { useParsedCronExpression } from '../../utils/useParsedCronExpression';
import { useTranslation } from '../../contexts/Translation';

/**
 * Gets the latest refresh stats (last refreshed time and parsed cron schedule)
 * and provides a trigger to refresh the associated table.
 * This is necessary if the logic of some tables as they
 * require expensive queries that prevent real time display of the data.
 * To get around this we use a materialized view that is periodically refreshed by a scheduled task
 */
export const useMaterializedViewRefreshStatsQuery = (
  viewName,
  { endpoint, recalculateDistanceFromNowIntervalMs } = {
    recalculateDistanceFromNowIntervalMs: 1000 * 60,
    endpoint: `${viewName}/refreshStats`,
  },
) => {
  const { getTranslation } = useTranslation();
  const [lastUpdated, setLastUpdated] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: refreshStats } = useAutoUpdatingQuery(endpoint);
  const schedule = useParsedCronExpression(refreshStats?.schedule);

  const dateAsDistanceToNow = useCallback(
    date =>
      formatDistanceToNow(parseISO(date), {
        addSuffix: getTranslation('schedule.distanceFromNow.suffix', 'ago'),
      }),
    [getTranslation],
  );
  const handleRefreshLastUpdated = useCallback(() => {
    const { lastRefreshed } = refreshStats;
    setLastUpdated(dateAsDistanceToNow(lastRefreshed));
  }, [dateAsDistanceToNow, refreshStats]);

  // Update the distance from now text every minute
  useEffect(() => {
    if (!refreshStats) return;
    const interval = setInterval(handleRefreshLastUpdated, recalculateDistanceFromNowIntervalMs);
    return () => clearInterval(interval);
  }, [refreshStats, recalculateDistanceFromNowIntervalMs, handleRefreshLastUpdated]);

  // Force a refresh of the table when the refresh stats data is updated
  useEffect(() => {
    if (refreshStats) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [refreshStats]);

  return {
    data: refreshStats && {
      schedule,
      lastUpdated: lastUpdated || dateAsDistanceToNow(refreshStats.lastRefreshed),
    },
    refreshTrigger,
  };
};
