import React from 'react';
import styled from 'styled-components';
import { Divider as DividerBase } from '@material-ui/core';

import { useVitalChartData } from '../../contexts/VitalChartData';
import { CHART_MARGIN, Y_AXIS_WIDTH } from '../../components/Charts/constants';
import { getVitalChartComponent } from './getVitalChartComponent';

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
      {chartKeys.map(chartKey => {
        const VitalChartComponent = getVitalChartComponent(chartKey);
        const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);
        const { yAxis: yAxisConfigs } = visualisationConfig;

        const yAxisTicks = getYAxisTicks(yAxisConfigs);
        const tableHeight = (yAxisTicks.length - 1) * MULTI_CHARTS_VIEW_INTERVAL_HEIGHT;
        const height =
          tableHeight + customisedXAxisTickHeight + CHART_MARGIN.top + CHART_MARGIN.bottom;

        return (
          <>
            <Divider />
            <TitleContainer>
              <span>{visualisationConfigs.find(config => config.key === chartKey)?.name}</span>
            </TitleContainer>
            <VitalChartComponent
              chartKey={chartKey}
              visualisationConfig={visualisationConfig}
              startDate={startDate}
              endDate={endDate}
              isLoading={isLoading}
              margin={CHART_MARGIN}
              tableHeight={tableHeight}
              height={height}
              yAxisTicks={yAxisTicks}
            />
          </>
        );
      })}
    </>
  );
};
