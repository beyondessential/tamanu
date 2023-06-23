import React from 'react';
import { DateTimeSelector } from '../components/Charts/components/DateTimeSelector';
import { useVitalChartData } from '../contexts/VitalChartData';
import { LineChart } from '../components/Charts/LineChart';

export const ChartsView = () => {
  const {
    chartData,
    visualisationConfig,
    setStartDate,
    setEndDate,
    startDate,
    endDate,
  } = useVitalChartData();

  return (
    <>
      <DateTimeSelector setStartDate={setStartDate} setEndDate={setEndDate} />
      <LineChart
        chartData={chartData}
        visualisationConfig={visualisationConfig}
        startDate={startDate}
        endDate={endDate}
      />
    </>
  );
};
