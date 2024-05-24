import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { WS_EVENT_NAMESPACES } from '@tamanu/constants';

import { useChangeDetectingQuery } from './useChangeDetectingQuery';
import { useParsedCronExpression } from '../../utils/useParsedCronExpression';
import { useTranslation } from '../../contexts/Translation';
import { useApi } from '../useApi';

/**
 * Gets the latest refresh stats (last refreshed time and parsed cron schedule)
 * and provides a trigger to refresh the associated table.
 * This is necessary if the logic of some tables as they
 * require expensive queries that prevent real time display of the data.
 * To get around this we use a materialized view that is periodically refreshed by a scheduled task
 */
export const useMaterializedViewRefreshStatsQuery = (
  viewName,
  { endpoint = `${viewName}/refreshStats`, recalculateDistanceFromNowIntervalMs = 1000 * 60 } = {},
) => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const [lastUpdated, setLastUpdated] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const queryResult = useChangeDetectingQuery(
    [endpoint],
    `${WS_EVENT_NAMESPACES.DATA_UPDATED}:${viewName}`,
    () => api.get(endpoint),
    {
      onOutdated: () => {
        setLastUpdated(null);
        setRefreshTrigger(count => count + 1);
      },
    },
  );
  const { data: refreshStats } = queryResult;
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

  return {
    ...queryResult,
    data: refreshStats && {
      schedule,
      lastUpdated: lastUpdated || dateAsDistanceToNow(refreshStats.lastRefreshed),
    },
    refreshTrigger,
  };
};
