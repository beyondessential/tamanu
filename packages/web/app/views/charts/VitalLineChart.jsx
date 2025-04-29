import React from 'react';
import { LineChart } from '../../components/Charts/LineChart';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { useEncounter } from '../../contexts/Encounter';
import { useGraphDataQuery } from '../../api/queries/useGraphDataQuery';
import { useVitalChartData } from '../../contexts/VitalChartData';

// Fetching and preparing data for vital chart
export const VitalLineChart = props => {
  const { chartKey, visualisationConfig, dateRange, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { isVital } = useVitalChartData();
  const { data: chartData, isLoading } = useGraphDataQuery(encounter.id, chartKey, dateRange, isVital);
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
      isVital={isVital}
    />
  );
};
