import React, { useContext } from 'react';
import { useVitalsVisualisationConfigsQuery } from '../api/queries/useVitalsVisualisationConfigsQuery';
import { GraphDataProviderFactory } from './GraphData';

export const VitalChartDataContext = React.createContext({
  visualisationConfigs: [],
  vitalChartModalOpen: false,
  setVitalChartModalOpen: () => {},
  setChartKeys: () => {},
  chartKeys: [''],
  modalTitle: '',
  setModalTitle: () => {},
  setDateRange: () => {},
  dateRange: ['', ''],
  isInMultiChartsView: false,
  setIsInMultiChartsView: () => {},
});

export const useVitalChartData = () => useContext(VitalChartDataContext);

export const VitalChartDataProvider = ({ children }) => {
  return (
    <GraphDataProviderFactory
      visualisationConfigQueryFn={useVitalsVisualisationConfigsQuery}
      Context={VitalChartDataContext}
    >
      {children}
    </GraphDataProviderFactory>
  );
};
