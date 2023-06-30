import React from 'react';
import styled from 'styled-components';
import { Divider as DividerBase } from '@material-ui/core';

import { useVitalChartData } from '../../contexts/VitalChartData';
import { CHART_MARGIN, Y_AXIS_WIDTH } from '../../components/Charts/constants';
import { getVitalChartComponent } from './getVitalChartComponent';
import { getVitalChartProps } from '../../components/Charts/helpers/getVitalChartProps';

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

  return (
    <>
      {chartKeys.map(chartKey => {
        const VitalChartComponent = getVitalChartComponent(chartKey);
        const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);
        const chartProps = getVitalChartProps({
          visualisationConfig,
          startDate,
          endDate,
          isInMultiChartsView: true,
        });

        return (
          <>
            <Divider />
            <TitleContainer>
              <span>{visualisationConfigs.find(config => config.key === chartKey)?.name}</span>
            </TitleContainer>
            <VitalChartComponent
              chartKey={chartKey}
              visualisationConfig={visualisationConfig}
              chartProps={chartProps}
            />
          </>
        );
      })}
    </>
  );
};
