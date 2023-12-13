import React from 'react';
import { useVitalQuery } from '../../api/queries/useVitalQuery';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';

// Fetching and preparing data for vital chart
export const VitalLineChart = props => {
  const { chartKey, visualisationConfig, dateRange, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { data: chartData, isLoading } = useVitalQuery(encounter.id, chartKey, dateRange);
  const chartProps = getVitalChartProps({
    visualisationConfig,
    dateRange,
    isInMultiChartsView,
  });

  return (
    <LineChart
      chartData={chartData}
      visualisationConfig={visualisationConfig}
      isLoading={isLoading}
      chartProps={chartProps}
    />
  );
};
