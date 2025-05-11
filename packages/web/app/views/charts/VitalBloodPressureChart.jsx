import React from 'react';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/constants';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';
import { useGraphDataQuery } from '../../api/queries/useGraphDataQuery';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';
import { useVitalChartData } from '../../contexts/VitalChartData';

// Fetching and preparing blood pressure data for vital chart
export const VitalBloodPressureChart = (props) => {
  const { visualisationConfig, dateRange, isInMultiChartsView } = props;
  const { encounter } = useEncounter();
  const { visualisationConfigs } = useVitalChartData();

  // Because this is a special view it needs more information
  const dbpVisualisationConfig = visualisationConfigs.find(
    (config) => config.key === VITALS_DATA_ELEMENT_IDS.dbp,
  );

  const { data: sbpChartData, isLoading: isSbpLoading } = useGraphDataQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.sbp,
    dateRange,
    true,
  );

  const { data: dbpChartData, isLoading: isDbpLoading } = useGraphDataQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.dbp,
    dateRange,
    true,
  );

  const chartData = sbpChartData.map((sbpData) => {
    const { name: recordedDate, value } = sbpData;
    const relatedDbpChartData = dbpChartData.find(
      ({ name: dbpRecordedDate }) => dbpRecordedDate === recordedDate,
    );
    const parsedTop = parseFloat(value);
    const parsedBottom = parseFloat(relatedDbpChartData?.value);
    return {
      name: recordedDate,
      value: parsedTop,
      inwardArrowVector: { top: parsedTop, bottom: parsedBottom },
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
        data-testid="linechart-60c3"
      />
    </>
  );
};
