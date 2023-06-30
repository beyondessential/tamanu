import React from 'react';

import { useVitalChartData } from '../../contexts/VitalChartData';
import { getVitalChartComponent } from './getVitalChartComponent';

export const SingleVitalChartView = () => {
  const {
    chartKeys,
    visualisationConfigs,
    startDate,
    endDate,
    isInMultiChartsView,
  } = useVitalChartData();
  const chartKey = chartKeys[0];
  const VitalChartComponent = getVitalChartComponent(chartKey);
  const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);

  return (
    <VitalChartComponent
      chartKey={chartKey}
      visualisationConfig={visualisationConfig}
      startDate={startDate}
      endDate={endDate}
      isInMultiChartsView={isInMultiChartsView}
    />
  );
};
