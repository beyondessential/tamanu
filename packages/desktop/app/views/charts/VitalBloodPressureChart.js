import React from 'react';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/shared/constants';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';
import { useVitalQuery } from '../../api/queries/useVitalQuery';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { useVitalChartData } from '../../contexts/VitalChartData';

// Fetching and preparing blood pressure data for vital chart
export const VitalBloodPressureChart = props => {
  const { visualisationConfig, dateRange, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { visualisationConfigs } = useVitalChartData();

  // Because this is a special view it needs more information
  const dbpVisualisationConfig = visualisationConfigs.find(
    config => config.key === VITALS_DATA_ELEMENT_IDS.dbp,
  );

  const { data: sbpChartData, isLoading: isSbpLoading } = useVitalQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.sbp,
    dateRange,
  );

  const { data: dbpChartData, isLoading: isDbpLoading } = useVitalQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.dbp,
    dateRange,
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
    dateRange,
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
        secondaryConfig={dbpVisualisationConfig}
      />
    </>
  );
};
