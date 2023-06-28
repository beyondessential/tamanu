import React from 'react';
import { Colors } from '../../../constants';
import { getHeightPerYAxisInterval } from '../helpers/getHeightPerYAxisInterval';

export const InwardArrowVectorDot = props => {
  // cx, cy is the position of the current dot
  const { cx, cy, payload, active, tableHeight } = props;
  if (!cx || !cy || !payload) {
    return null;
  }

  const { inwardArrowVector, visualisationConfig } = payload;
  const { top, bottom } = inwardArrowVector;
  const { yAxis } = visualisationConfig;
  const { interval } = yAxis;
  const heightPerInterval = getHeightPerYAxisInterval(yAxis, tableHeight);
  const vectorHeight = ((top - bottom) / interval) * heightPerInterval;

  const verticalLine = {
    bottom: { x: 6, y: 7.5 + vectorHeight },
  };
  const startAndEndPointOfBottomInWardArrow = {
    y: verticalLine.bottom.y + 6,
  };
  return (
    <svg
      x={cx - 6}
      y={cy - 7}
      width="12"
      height={startAndEndPointOfBottomInWardArrow + 2}
      viewBox={`0 0 12 ${startAndEndPointOfBottomInWardArrow + 2}`}
      fill="none"
    >
      <path
        d={`M1 1L6 7L11 1M6 7V${verticalLine.bottom.y}M1 ${startAndEndPointOfBottomInWardArrow.y}L${verticalLine.bottom.x} ${verticalLine.bottom.y}L11 ${startAndEndPointOfBottomInWardArrow.y}`}
        stroke={active ? Colors.midText : Colors.darkestText}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
