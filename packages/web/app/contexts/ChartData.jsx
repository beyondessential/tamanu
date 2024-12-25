import React, { createContext, useContext, useState } from 'react';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';

const ChartDataContext = createContext({
  selectedChartTypeId: null,
  setSelectedChartTypeId: () => {},
});

export const useChartData = () => useContext(ChartDataContext);

export const ChartDataProvider = ({ children }) => {
  const { data: userPreferences } = useUserPreferencesQuery();
  const [selectedChartTypeId, setSelectedChartTypeId] = useState(
    userPreferences?.selectedChartTypeId,
  );

  return (
    <ChartDataContext.Provider
      value={{
        selectedChartTypeId,
        setSelectedChartTypeId,
      }}
    >
      {children}
    </ChartDataContext.Provider>
  );
};
