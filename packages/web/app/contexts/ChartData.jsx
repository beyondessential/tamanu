import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';
import { useEncounter } from './Encounter';
import { useEncounterChartWithResponseQuery } from '../api/queries/useEncounterChartWithResponseQuery';
import { combineQueries } from '../api';
import { useChartSurveysQuery } from '../api/queries';

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
  const chartSurveysQuery = useChartSurveysQuery(encounter?.id);
  const {
    data: [userPreferences, chartWithResponse, chartSurveys],
    isLoading,
    isFetching,
  } = combineQueries([userPreferencesQuery, chartWithResponseQuery, chartSurveysQuery]);
  const shouldInit = !isLoading && !isInitiated && !isFetching;

  useEffect(() => {
    if (!shouldInit) return;
    // Only set initial type if encounter has chart responses
    if (chartWithResponse?.data) {
      // Prioritize user preference, chart with response is only a fallback
      const hasUserPreference = !!userPreferences?.selectedChartTypeId;
      const userPreferenceIsSelectable = chartSurveys?.chartSurveys?.some(
        (survey) => survey.id === userPreferences?.selectedChartTypeId,
      );
      if (hasUserPreference && userPreferenceIsSelectable) {
        setSelectedChartTypeId(userPreferences?.selectedChartTypeId);
      } else {
        setSelectedChartTypeId(chartWithResponse?.data?.survey.id);
      }
    }
    setIsInitiated(true);
  }, [userPreferences, chartWithResponse, chartSurveys,shouldInit]);

  const contextValue = useMemo(() => ({
    isLoading: !isInitiated,
    selectedChartTypeId,
    setSelectedChartTypeId,
  }), [isInitiated, selectedChartTypeId, setSelectedChartTypeId]);

  return (
    <ChartDataContext.Provider value={contextValue}>
      {children}
    </ChartDataContext.Provider>
  );
};
