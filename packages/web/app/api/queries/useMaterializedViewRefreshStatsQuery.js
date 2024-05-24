import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { WS_EVENT_NAMESPACES } from '@tamanu/constants';

import { useOutdatingQuery } from './useOutdatingQuery';
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
  { endpoint, distanceFromNowInterval } = {
    distanceFromNowInterval: 1000 * 60,
    endpoint: `${viewName}/refreshStats`,
  },
) => {
  const api = useApi();
  const { storedLanguage } = useTranslation();
  const [lastUpdated, setLastUpdated] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const queryResult = useOutdatingQuery(
    ['materialisedViewRefreshStats', viewName],
    `${WS_EVENT_NAMESPACES.DATA_UPDATED}:${viewName}`,
    () => api.get(endpoint, { language: storedLanguage }),
    {
      onOutdated: () => {
        setLastUpdated(null);
        setRefreshTrigger(count => count + 1);
      },
    },
  );
  const { data: refreshStats } = queryResult;

  const dateAsDistanceToNow = date => formatDistanceToNow(parseISO(date), { addSuffix: 'ago' });
  const handleRefreshLastUpdated = useCallback(() => {
    const { lastRefreshed } = refreshStats;
    setLastUpdated(dateAsDistanceToNow(lastRefreshed));
  }, [refreshStats]);

  // Update the distance from now text every minute
  useEffect(() => {
    if (!refreshStats) return;
    const interval = setInterval(handleRefreshLastUpdated, distanceFromNowInterval);
    return () => clearInterval(interval);
  }, [refreshStats, distanceFromNowInterval, handleRefreshLastUpdated]);

  return {
    ...queryResult,
    data: refreshStats && {
      schedule: refreshStats.schedule,
      lastUpdated: lastUpdated || dateAsDistanceToNow(refreshStats.lastRefreshed),
    },
    refreshTrigger,
  };
};
