import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';
import { useEncounter } from './Encounter';
import { useEncounterChartWithResponseQuery } from '../api/queries/useEncounterChartWithResponseQuery';
import { combineQueries } from '../api';

const ChartDataContext = createContext({
  selectedChartTypeId: null,
  setSelectedChartTypeId: () => {},
});

export const useChartData = () => useContext(ChartDataContext);

export const ChartDataProvider = ({ children }) => {
  const { encounter } = useEncounter();
  const [isInitiated, setIsInitiated] = useState(false);
  const [selectedChartTypeId, setSelectedChartTypeId] = useState('');
  const userPreferencesQuery = useUserPreferencesQuery();
  const chartWithResponseQuery = useEncounterChartWithResponseQuery(encounter?.id);
  const {
    data: [userPreferences, chartWithResponse],
    isLoading,
  } = combineQueries([userPreferencesQuery, chartWithResponseQuery]);

  useEffect(() => {
    if (!isLoading && !isInitiated) {
      const chartResponseId = chartWithResponse?.[0]?.id;
      // Only set initial type if encounter has chart responses
      if (chartResponseId) {
        // Prioritize user preference, chart with response is only a fallback
        const initialChart = userPreferences?.selectedChartTypeId ?? chartResponseId;
        setSelectedChartTypeId(initialChart);
      }
      setIsInitiated(true);
    }
  }, [userPreferences, chartWithResponse, isInitiated, isLoading]);

  return (
    <ChartDataContext.Provider
      value={{
        isLoading: !isInitiated,
        selectedChartTypeId,
        setSelectedChartTypeId,
      }}
    >
      {children}
    </ChartDataContext.Provider>
  );
};
