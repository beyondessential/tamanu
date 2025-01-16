import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';

const ChartDataContext = createContext({
  selectedChartTypeId: null,
  setSelectedChartTypeId: () => {},
});

export const useChartData = () => useContext(ChartDataContext);

export const ChartDataProvider = ({ children }) => {
  const { data: userPreferences, isLoading } = useUserPreferencesQuery();
  const [selectedChartTypeId, setSelectedChartTypeId] = useState(
    userPreferences?.selectedChartTypeId,
  );

  useEffect(() => {
    if (userPreferences) {
      setSelectedChartTypeId(userPreferences?.selectedChartTypeId);
    }
  }, [userPreferences]);

  return (
    <ChartDataContext.Provider
      value={{
        isLoading,
        selectedChartTypeId,
        setSelectedChartTypeId,
      }}
    >
      {children}
    </ChartDataContext.Provider>
  );
};
