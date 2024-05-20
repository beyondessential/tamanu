import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../contexts/Translation';
import { useSocket } from '../../utils/useSocket';
import { useApi } from '../useApi';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { MATERIALIZED_VIEW_REFRESH_CONFIG } from '@tamanu/constants';

/**
 * Gets the latest refresh stats (last refreshed time and parsed cron schedule)
 * and provides a trigger to refresh the associated table.
 * This is necessary if the logic of some tables as they
 * require expensive queries that prevent real time display of the data.
 * To get around this we use a materialized view that is periodically refreshed by a scheduled task
 */
export const useMaterializedViewRefreshStatsQuery = viewName => {
  const refreshConfig = MATERIALIZED_VIEW_REFRESH_CONFIG[viewName];
  if (!refreshConfig) throw new Error(`Unknown view name: ${viewName}`);
  const { statsEndpoint, refreshEvent } = refreshConfig;
  const api = useApi();
  const { socket } = useSocket();
  const { storedLanguage } = useTranslation();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const queryResult = useQuery(['materialisedViewRefreshStats', viewName], () =>
    api.get(statsEndpoint, { language: storedLanguage }),
  );
  const { data: refreshStats } = queryResult;

  const dateAsDistanceToNow = date => formatDistanceToNow(parseISO(date), { addSuffix: 'ago' });

  const handleFreshData = useCallback(() => {
    setLastUpdated(null);
    setRefreshTrigger(count => count + 1);
    queryClient.invalidateQueries(['materialisedViewRefreshStats', viewName]);
  }, [queryClient, viewName]);

  const handleRefreshLastUpdated = useCallback(() => {
    const { lastRefreshed } = refreshStats;
    setLastUpdated(dateAsDistanceToNow(lastRefreshed));
  }, [refreshStats]);

  // Update the distance from now text every minute
  useEffect(() => {
    if (!refreshStats) return;
    const interval = setInterval(handleRefreshLastUpdated, 1000 * 60);
    return () => clearInterval(interval);
  }, [refreshStats, handleRefreshLastUpdated]);

  // Listen for refresh event from scheduled task
  useEffect(() => {
    if (!socket) return;
    socket.on(refreshEvent, handleFreshData);
    return () => socket.off(refreshEvent, handleFreshData);
  }, [socket, handleFreshData, refreshEvent]);

  return {
    ...queryResult,
    data: refreshStats && {
      schedule: refreshStats.schedule,
      lastUpdated: lastUpdated || dateAsDistanceToNow(refreshStats.lastRefreshed),
    },
    refreshTrigger,
  };
};
