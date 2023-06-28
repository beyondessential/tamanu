import React from 'react';
import {
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart as LineChartComponent,
  Customized,
} from 'recharts';
import { getXAxisTicks, getYAxisTicks } from './helpers/axisTicks';
import { DISPLAY_VALUE_KEY, getMeasureData } from './helpers/getMeasureData';
import {
  CustomisedXAxisTick,
  CustomisedYAxisTick,
  customisedXAxisTickHeight,
} from './components/CustomisedTick';
import { Colors } from '../../constants';
import { ReferenceBands } from './components/ReferenceBands';
import { CustomDot } from './components/CustomDot';
import { NoDataStateScreen } from './components/NoDataStateScreen';
import { CHART_MARGIN, Y_AXIS_WIDTH } from './constants';
import { InwardArrowVectorDot } from './components/InwardArrowVectorDot';
import { CustomTooltip } from './components/CustomTooltip';

export const LineChart = props => {
  const {
    chartData,
    visualisationConfig,
    startDate,
    endDate,
    xAxisTicks = getXAxisTicks(startDate, endDate),
    yAxisTicks = getYAxisTicks(visualisationConfig.yAxis),
    margin = CHART_MARGIN,
    height = 500,
    tableHeight = height - margin.top - margin.bottom - customisedXAxisTickHeight, // height minor the margin and the x-axis ticks
    isLoading,
    useInwardArrowVector,
  } = props;

  const { yAxis: yAxisConfigs } = visualisationConfig;
  const isNoData = chartData.length === 0 && !isLoading;
  const measureData = getMeasureData(chartData, visualisationConfig, useInwardArrowVector);
  const DotComponent = useInwardArrowVector ? InwardArrowVectorDot : CustomDot;

  return (
    <LineChartComponent width={1856} height={height} data={measureData} margin={margin}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        interval={0}
        tick={<CustomisedXAxisTick />}
        dataKey="timestamp"
        tickLine={false}
        ticks={xAxisTicks}
        type="number"
        scale="time"
        domain={[xAxisTicks[0], xAxisTicks[xAxisTicks.length - 1]]}
      />
      <YAxis
        width={Y_AXIS_WIDTH}
        domain={[yAxisConfigs.graphRange.min, yAxisConfigs.graphRange.max]}
        interval={0}
        tick={<CustomisedYAxisTick />}
        ticks={yAxisTicks}
        tickLine={false}
        allowDataOverflow
      />
      {yAxisConfigs.normalRange.min !== yAxisConfigs.graphRange.min && (
        <ReferenceLine y={yAxisConfigs.normalRange.min} stroke={Colors.alert} />
      )}
      {yAxisConfigs.normalRange.max !== yAxisConfigs.graphRange.max && (
        <ReferenceLine y={yAxisConfigs.normalRange.max} stroke={Colors.alert} />
      )}
      <ReferenceArea
        shape={shapeProps => (
          <ReferenceBands
            {...shapeProps}
            rangesToHighlight={[
              [yAxisConfigs.normalRange.min, yAxisConfigs.graphRange.min],
              [yAxisConfigs.normalRange.max, yAxisConfigs.graphRange.max],
            ]}
            yAxisConfigs={yAxisConfigs}
          />
        )}
      />
      <Tooltip
        wrapperStyle={{
          backgroundColor: Colors.white,
          boxShadow: `0px 4px 20px rgba(0, 0, 0, 0.1)`,
          borderRadius: '5px',
        }}
        content={<CustomTooltip useInwardArrowVector={useInwardArrowVector} />}
      />
      <Line
        type="monotone"
        dataKey={DISPLAY_VALUE_KEY}
        stroke={Colors.blue}
        strokeWidth={2}
        dot={<DotComponent tableHeight={tableHeight} />}
        activeDot={<DotComponent active tableHeight={tableHeight} />}
        isAnimationActive={false}
      />
      {isNoData && <Customized component={<NoDataStateScreen />} />}
    </LineChartComponent>
  );
};
