import React from 'react';
import { VITALS_DATA_ELEMENT_IDS } from '@tamanu/shared/constants';
import { useVitalChartData } from '../../contexts/VitalChartData';
import { LineChart } from '../../components/Charts/LineChart';
import { useEncounter } from '../../contexts/Encounter';
import { useVitalQuery } from '../../api/queries/useVitalQuery';

// Fetching and preparing blood pressure data for vital chart
export const BloodPressureVitalChartView = props => {
  const { chartKey } = props;
  const { visualisationConfigs, startDate, endDate, isInMultiChartsView } = useVitalChartData();
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

  const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);
  const chartData = SBPChartData.map(SBPData => {
    const { recordedDate, value } = SBPData;
    const relatedDBPChartData = DBPChartData.find(
      ({ recordedDate: DBPRecordedDate }) => DBPRecordedDate === recordedDate,
    );
    return {
      name: recordedDate,
      value,
      inwardArrowVector: { top: value, bottom: relatedDBPChartData?.value },
    };
  });

  return (
    <>
      <LineChart
        chartData={chartData}
        visualisationConfig={visualisationConfig}
        startDate={startDate}
        endDate={endDate}
        isLoading={isSBPLoading || isDBPLoading}
        isInMultiChartsView={isInMultiChartsView}
        useInwardArrowVector
      />
    </>
  );
};
