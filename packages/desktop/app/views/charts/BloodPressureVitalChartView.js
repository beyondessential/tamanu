import React from 'react';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/shared/constants';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';
import { useVitalQuery } from '../../api/queries/useVitalQuery';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';

// Fetching and preparing blood pressure data for vital chart
export const BloodPressureVitalChartView = props => {
  const { visualisationConfig, startDate, endDate, isInMultiChartsView } = props;
  const { encounter } = useEncounter();

  const { data: SBPChartData, isLoading: isSBPLoading } = useVitalQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.sbp,
    startDate,
    endDate,
  );

  const { data: DBPChartData, isLoading: isDBPLoading } = useVitalQuery(
    encounter.id,
    VITALS_DATA_ELEMENT_IDS.dbp,
    startDate,
    endDate,
  );

  const chartData = SBPChartData.map(SBPData => {
    const { recordedDate, body } = SBPData;
    const relatedDBPChartData = DBPChartData.find(
      ({ recordedDate: DBPRecordedDate }) => DBPRecordedDate === recordedDate,
    );
    return {
      name: recordedDate,
      value: body,
      inwardArrowVector: { top: body, bottom: relatedDBPChartData?.body },
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
        isLoading={isSBPLoading || isDBPLoading}
        chartProps={chartProps}
        useInwardArrowVector
      />
    </>
  );
};
