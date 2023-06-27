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
import { TooltipContent } from './components/TooltipContent';
import { getXAxisTicks, getYAxisTicks } from './helpers/axisTicks';
import { DISPLAY_VALUE_KEY, getMeasureData } from './helpers/getMeasureData';
import {
  CustomisedXAxisTick,
  CustomisedYAxisTick,
  XAxisTickHeight,
} from './components/CustomisedTick';
import { Colors } from '../../constants';
import { ReferenceBands } from './components/ReferenceBands';
import { CustomDot } from './components/CustomDot';
import { NoDataStateScreen } from './components/NoDataStateScreen';

export const Y_AXIS_WIDTH = 40;
const INTERVAL_HEIGHT = 20;

const CustomTooltip = ({ payload }) => {
  if (payload && payload.length) {
    const { value, name, dotColor, description, config } = payload[0].payload;

    return (
      <TooltipContent
        label={name}
        value={value}
        dotColor={dotColor}
        description={description}
        config={config}
      />
    );
  }

  return null;
};

export const LineChart = props => {
  const {
    chartData,
    visualisationConfig,
    startDate,
    endDate,
    isLoading,
    isInMultiChartsView,
  } = props;
  if (!visualisationConfig.hasVitalChart) {
    return null;
  }

  const { yAxis: yAxisConfigs } = visualisationConfig;

  const isNoData = chartData.length === 0 && !isLoading;
  const measureData = getMeasureData(chartData, yAxisConfigs);
  const xAxisTicks = getXAxisTicks(startDate, endDate);
  const yAxisTicks = getYAxisTicks(yAxisConfigs);
  const height = isInMultiChartsView
    ? (yAxisTicks.length - 1) * INTERVAL_HEIGHT + XAxisTickHeight
    : 500;

  return (
    <LineChartComponent
      width={1556}
      height={height}
      data={measureData}
      margin={{ top: 7, bottom: 15, left: 0, right: 30 }}
    >
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
        content={<CustomTooltip />}
      />
      <Line
        type="monotone"
        dataKey={DISPLAY_VALUE_KEY}
        stroke={Colors.blue}
        strokeWidth={2}
        dot={<CustomDot />}
        activeDot={<CustomDot active />}
        isAnimationActive={false}
      />
      {isNoData && <Customized component={<NoDataStateScreen />} />}
    </LineChartComponent>
  );
};
