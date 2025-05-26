import React, { useContext } from 'react';
import { useVitalsVisualisationConfigsQuery } from '../api/queries/useVitalsVisualisationConfigsQuery';
import { GraphDataProviderFactory } from './GraphData';
import { useChartsVisualisationConfigsQuery } from '../api/queries/useChartsVisualisationConfigsQuery';

export const VitalChartDataContext = React.createContext({
  isVital: false,
  visualisationConfigs: [],
  allGraphedChartKeys: [],
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
      isVital
    >
      {children}
    </GraphDataProviderFactory>
  );
};

export const ChartGraphDataProvider = ({ children }) => {
  return (
    <GraphDataProviderFactory
      visualisationConfigQueryFn={useChartsVisualisationConfigsQuery}
      Context={VitalChartDataContext}
    >
      {children}
    </GraphDataProviderFactory>
  );
};
