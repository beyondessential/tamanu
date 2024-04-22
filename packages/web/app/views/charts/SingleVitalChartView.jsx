import React from 'react';

import { useVitalChartData } from '../../contexts/VitalChartData';
import { getVitalChartComponent } from './getVitalChartComponent';

export const SingleVitalChartView = () => {
  const { chartKeys, visualisationConfigs, dateRange, isInMultiChartsView } = useVitalChartData();
  const chartKey = chartKeys[0];
  const VitalChartComponent = getVitalChartComponent(chartKey);
  const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);

  return (
    <VitalChartComponent
      chartKey={chartKey}
      visualisationConfig={visualisationConfig}
      dateRange={dateRange}
      isInMultiChartsView={isInMultiChartsView}
    />
  );
};
