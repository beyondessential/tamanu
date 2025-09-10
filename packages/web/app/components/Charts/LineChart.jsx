import { TAMANU_COLORS } from '@tamanu/ui-components';
import React from 'react';
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart as LineChartComponent,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DISPLAY_VALUE_KEY, getMeasureData } from './helpers/getMeasureData';
import { CustomisedXAxisTick, CustomisedYAxisTick } from './components/CustomisedTick';
import { ReferenceBands } from './components/ReferenceBands';
import { CustomDot } from './components/CustomDot';
import { NoDataStateScreen } from './components/NoDataStateScreen';
import { Y_AXIS_WIDTH } from './constants';
import { InwardArrowVectorDot } from './components/InwardArrowVectorDot';
import { CustomTooltip } from './components/CustomTooltip';

export const LineChart = (props) => {
  const {
    isVital = false,
    chartData,
    visualisationConfig,
    isLoading,
    useInwardArrowVector,
    chartProps,
    secondaryConfig,
  } = props;

  const { margin, tableHeight, height, xAxisTicks, yAxisTicks } = chartProps;
  const { yAxis: yAxisConfigs } = visualisationConfig;
  const measureData = getMeasureData(
    chartData,
    visualisationConfig,
    useInwardArrowVector,
    secondaryConfig,
  );
  const DotComponent = useInwardArrowVector ? InwardArrowVectorDot : CustomDot;

  return (
    <ResponsiveContainer width="100%" height={height} data-testid="responsivecontainer-01ju">
      <LineChartComponent data={measureData} margin={margin} data-testid="linechartcomponent-tt6p">
        <CartesianGrid strokeDasharray="3 3" data-testid="cartesiangrid-vpn9" />
        <XAxis
          interval={0}
          tick={<CustomisedXAxisTick data-testid="customisedxaxistick-vyn4" />}
          dataKey="timestamp"
          tickLine={false}
          ticks={xAxisTicks}
          type="number"
          scale="time"
          domain={[xAxisTicks[0], xAxisTicks[xAxisTicks.length - 1]]}
          data-testid="xaxis-srwv"
        />
        <YAxis
          width={Y_AXIS_WIDTH}
          domain={[yAxisConfigs.graphRange.min, yAxisConfigs.graphRange.max]}
          interval={0}
          tick={<CustomisedYAxisTick data-testid="customisedyaxistick-341w" />}
          ticks={yAxisTicks}
          tickLine={false}
          allowDataOverflow
          data-testid="yaxis-5scc"
        />
        {yAxisConfigs.normalRange.min !== yAxisConfigs.graphRange.min && (
          <ReferenceLine
            y={yAxisConfigs.normalRange.min}
            stroke={TAMANU_COLORS.alert}
            data-testid="referenceline-e2y7"
          />
        )}
        {yAxisConfigs.normalRange.max !== yAxisConfigs.graphRange.max && (
          <ReferenceLine
            y={yAxisConfigs.normalRange.max}
            stroke={TAMANU_COLORS.alert}
            data-testid="referenceline-6uf9"
          />
        )}
        <ReferenceArea
          shape={(shapeProps) => (
            <ReferenceBands
              {...shapeProps}
              rangesToHighlight={[
                [yAxisConfigs.normalRange.min, yAxisConfigs.graphRange.min],
                [yAxisConfigs.normalRange.max, yAxisConfigs.graphRange.max],
              ]}
              yAxisConfigs={yAxisConfigs}
              data-testid="referencebands-6wdh"
            />
          )}
          data-testid="referencearea-aizy"
        />
        <Tooltip
          wrapperStyle={{
            backgroundColor: TAMANU_COLORS.white,
            boxShadow: `0px 4px 20px rgba(0, 0, 0, 0.1)`,
            borderRadius: '5px',
          }}
          content={
            <CustomTooltip
              useInwardArrowVector={useInwardArrowVector}
              data-testid="customtooltip-rzem"
            />
          }
          data-testid="tooltip-3sq7"
        />
        <Line
          type="linear"
          dataKey={DISPLAY_VALUE_KEY}
          stroke={TAMANU_COLORS.blue}
          strokeWidth={2}
          dot={<DotComponent tableHeight={tableHeight} data-testid="dotcomponent-y4cv" />}
          activeDot={
            <DotComponent active tableHeight={tableHeight} data-testid="dotcomponent-1r8z" />
          }
          isAnimationActive={false}
          data-testid="line-yc2y"
        />
        {(chartData.length === 0 || isLoading) && (
          <Customized
            component={
              <NoDataStateScreen isLoading={isLoading} isVital={isVital} data-testid="nodatastatescreen-v4iv" />
            }
            data-testid="customized-11uz"
          />
        )}
      </LineChartComponent>
    </ResponsiveContainer>
  );
};
