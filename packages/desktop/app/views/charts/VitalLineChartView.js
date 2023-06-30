import React from 'react';
import { LineChart } from '../../components/Charts/LineChart';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { useEncounter } from '../../contexts/Encounter';
import { useVitalQuery } from '../../api/queries/useVitalQuery';

// Fetching and preparing data for vital chart
export const VitalLineChartView = props => {
  const { chartKey, visualisationConfig, startDate, endDate, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { data: chartData, isLoading } = useVitalQuery(encounter.id, chartKey, startDate, endDate);
  const chartProps = getVitalChartProps({
    visualisationConfig,
    startDate,
    endDate,
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
