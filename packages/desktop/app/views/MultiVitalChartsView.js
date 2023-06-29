import React from 'react';
import styled from 'styled-components';
import { Divider as DividerBase } from '@material-ui/core';

import { useVitalChartData } from '../contexts/VitalChartData';
import { LineChart } from '../components/Charts/LineChart';
import { useEncounter } from '../contexts/Encounter';
import { useVitalQueries } from '../api/queries/useVitalQuery';
import { CHART_MARGIN, Y_AXIS_WIDTH } from '../components/Charts/constants';

const Divider = styled(DividerBase)`
  margin-left: ${Y_AXIS_WIDTH}px;
  margin-right: ${CHART_MARGIN.right}px;
`;

const TitleContainer = styled.div`
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  padding-left: ${Y_AXIS_WIDTH}px;
  padding-top: 15px;
`;

// Fetching and preparing data for vital chart
export const MultiVitalChartsView = () => {
  const { visualisationConfigs, chartKeys, startDate, endDate } = useVitalChartData();
  const { encounter } = useEncounter();
  const { data: chartsData, isLoading } = useVitalQueries(
    encounter.id,
    chartKeys,
    startDate,
    endDate,
  );

  return (
    <>
      {chartKeys.map((chartKey, index) => {
        const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);
        const chartData = chartsData[index];

        return (
          <>
            <Divider />
            <TitleContainer>
              <span>{visualisationConfigs.find(config => config.key === chartKey)?.name}</span>
            </TitleContainer>
            <LineChart
              chartData={chartData}
              visualisationConfig={visualisationConfig}
              startDate={startDate}
              endDate={endDate}
              isLoading={isLoading}
            />
          </>
        );
      })}
    </>
  );
};
