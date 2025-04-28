import React from 'react';
import { LineChart } from '../../components/Charts/LineChart';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { useEncounter } from '../../contexts/Encounter';
import { useGraphDataQuery } from '../../api/queries/useGraphDataQuery';

// Fetching and preparing data for vital chart
export const VitalLineChart = props => {
  const { chartKey, visualisationConfig, dateRange, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { data: chartData, isLoading } = useGraphDataQuery(encounter.id, chartKey, dateRange, true);
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
      isVital
    />
  );
};
