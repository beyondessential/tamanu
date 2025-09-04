import React from 'react';
import styled from 'styled-components';
import { Box, Divider as DividerBase } from '@mui/material';

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
  const { isVital, visualisationConfigs, chartKeys, dateRange } = useVitalChartData();

  return (
    <Box minHeight="80vh" maxHeight="80vh" data-testid="box-38t4">
      {chartKeys.map(chartKey => {
        const VitalChartComponent = getVitalChartComponent(chartKey, isVital);
        const visualisationConfig = visualisationConfigs.find(config => config.key === chartKey);

        return (
          <div key={chartKey}>
            <Divider style={{ marginRight: 0 }} data-testid={`divider-1j3f-${chartKey}`} />
            <TitleContainer data-testid={`titlecontainer-0v6s-${chartKey}`}>
              <span>{visualisationConfigs.find(config => config.key === chartKey)?.name}</span>
            </TitleContainer>
            <VitalChartComponent
              chartKey={chartKey}
              dateRange={dateRange}
              visualisationConfig={visualisationConfig}
              isInMultiChartsView
              data-testid={`vitalchartcomponent-hrwb-${chartKey}`}
            />
          </div>
        );
      })}
    </Box>
  );
};
