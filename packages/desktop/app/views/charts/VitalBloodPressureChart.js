import React from 'react';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/shared/constants';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';
import { useVitalQuery } from '../../api/queries/useVitalQuery';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';

// Fetching and preparing blood pressure data for vital chart
export const VitalBloodPressureChart = props => {
  const { visualisationConfig, startDate, endDate, isInMultiChartsView } = props;
  const { encounter } = useEncounter();

  const { data: sbpChartData, isLoading: isSbpLoading } = useVitalQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.sbp,
    startDate,
    endDate,
  );

  const { data: dbpChartData, isLoading: isDbpLoading } = useVitalQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.dbp,
    startDate,
    endDate,
  );

  const chartData = sbpChartData.map(sbpData => {
    const { name: recordedDate, value } = sbpData;
    const relatedDbpChartData = dbpChartData.find(
      ({ name: dbpRecordedDate }) => dbpRecordedDate === recordedDate,
    );
    return {
      name: recordedDate,
      value,
      inwardArrowVector: { top: value, bottom: relatedDbpChartData?.value },
    };
  });

  const chartProps = getVitalChartProps({
    visualisationConfig,
    startDate,
    endDate,
    isInMultiChartsView,
  });

  return (
    <>
      <LineChart
        chartData={chartData}
        visualisationConfig={visualisationConfig}
        isLoading={isSbpLoading || isDbpLoading}
        chartProps={chartProps}
        useInwardArrowVector
      />
    </>
  );
};
