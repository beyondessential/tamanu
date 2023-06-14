import React from 'react';
import { Colors } from '../../../constants';

export const ReferenceBands = props => {
  const {
    x,
    y: startPointY,
    width,
    height: totalHeight,
    rangesToHighlight = [],
    yAxisConfigs,
  } = props;

  if (
    !rangesToHighlight ||
    rangesToHighlight.length === 0 ||
    !yAxisConfigs.graphRange ||
    !yAxisConfigs.graphRange.min ||
    !yAxisConfigs.graphRange.max ||
    yAxisConfigs.graphRange.min >= yAxisConfigs.graphRange.max ||
    yAxisConfigs.interval <= 0
  ) {
    console.error('Warning: Invalid props for ReferenceBands');
    return null;
  }

  const totalGaps =
    (yAxisConfigs.graphRange.max - yAxisConfigs.graphRange.min) / yAxisConfigs.interval;
  const heightPerGap = totalHeight / totalGaps;

  const bands = rangesToHighlight.map(([start, end]) => {
    const yFromStartOrEnd = start > end ? start : end;
    const y = startPointY + Math.abs(yAxisConfigs.graphRange.max - yFromStartOrEnd) * heightPerGap;
    const height = Math.abs(start - end) * heightPerGap;

    return { y, height };
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
