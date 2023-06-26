import React from 'react';
import { DateTimeSelector } from '../components/Charts/components/DateTimeSelector';
import { useVitalChartData } from '../contexts/VitalChartData';
import { LineChart } from '../components/Charts/LineChart';

export const VitalChartView = props => {
  const { chartKey } = props;
  const {
    chartData,
    visualisationConfigs,
    setStartDate,
    setEndDate,
    startDate,
    endDate,
    isLoading,
  } = useVitalChartData();

  const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);

  return (
    <>
      <DateTimeSelector setStartDate={setStartDate} setEndDate={setEndDate} />
      <LineChart
        chartData={chartData}
        visualisationConfig={visualisationConfig}
        startDate={startDate}
        endDate={endDate}
        isLoading={isLoading}
      />
    </>
  );
};
