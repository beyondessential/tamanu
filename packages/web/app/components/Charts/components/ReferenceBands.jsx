import React from 'react';
import { Colors } from '../../../constants';
import { getHeightPerYAxisInterval } from '../helpers/getHeightPerYAxisInterval';

const calculateBandsStartPointAndHeight = ({
  startPointY,
  yAxisConfigs,
  rangesToHighlight,
  heightPerInterval,
}) => {
  return rangesToHighlight.map(([start, end]) => {
    const yFromStartOrEnd = start > end ? start : end;
    const y =
      startPointY +
      (Math.abs(yAxisConfigs.graphRange.max - yFromStartOrEnd) / yAxisConfigs.interval) *
        heightPerInterval;
    const height = (Math.abs(start - end) / yAxisConfigs.interval) * heightPerInterval;

    return { y, height };
  });
};

export const ReferenceBands = props => {
  const {
    x,
    y: startPointY,
    width,
    height: totalHeight,
    rangesToHighlight = [],
    yAxisConfigs,
  } = props;

  const heightPerInterval = getHeightPerYAxisInterval(yAxisConfigs, totalHeight);
  const bands = calculateBandsStartPointAndHeight({
    startPointY,
    yAxisConfigs,
    rangesToHighlight,
    heightPerInterval,
  });

  return (
    <g>
      {bands.map(({ y, height }) => (
        <rect
          key={y}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={Colors.alert}
          fillOpacity={0.1}
        />
      ))}
    </g>
  );
};
