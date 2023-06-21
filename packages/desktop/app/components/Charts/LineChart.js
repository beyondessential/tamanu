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
} from 'recharts';
import { TooltipContent } from './components/TooltipContent';
import { getXAxisTicks, getYAxisTicks } from './helpers/axisTicks';
import { DISPLAY_VALUE_KEY, getMeasureData } from './helpers/getMeasureData';
import { CustomisedTick } from './components/CustomisedTick';
import { Colors } from '../../constants';
import { ReferenceBands } from './components/ReferenceBands';
import { CustomDot } from './components/CustomDot';

const CustomTooltip = ({ payload }) => {
  if (payload && payload.length) {
    const { value, name, dotColor, description } = payload[0].payload;

    return (
      <TooltipContent label={name} value={value} dotColor={dotColor} description={description} />
    );
  }

  return null;
};

export const LineChart = props => {
  const { chartData, visualisationConfig, startDate, endDate } = props;
  const { yAxis: yAxisConfigs } = visualisationConfig;
  if (!yAxisConfigs || Object.keys(yAxisConfigs).length === 0) {
    return null;
  }

  const measureData = getMeasureData(chartData, yAxisConfigs);
  const xAxisTicks = getXAxisTicks(startDate, endDate);
  const yAxisTicks = getYAxisTicks(yAxisConfigs);

  return (
    <LineChartComponent
      width={1056}
      height={500}
      data={measureData}
      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        interval={0}
        tick={<CustomisedTick />}
        dataKey="timestamp"
        tickLine={false}
        ticks={xAxisTicks}
        type="number"
        scale="time"
        domain={[xAxisTicks[0], xAxisTicks[xAxisTicks.length - 1]]}
      />
      <YAxis
        domain={[yAxisConfigs.graphRange.min, yAxisConfigs.graphRange.max]}
        interval={0}
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
    </LineChartComponent>
  );
};
