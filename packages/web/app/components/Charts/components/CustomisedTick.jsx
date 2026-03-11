import React from 'react';
import styled from 'styled-components';
import { useDateTime } from '@tamanu/ui-components';
import { Colors } from '../../../constants';

const TextFontSize = 11;
const xAxisTickTimeY = 23;
export const customisedXAxisLabelHeight = xAxisTickTimeY + TextFontSize - 0.5;

const Text = styled.text`
  font-size: ${TextFontSize}px;
  font-weight: 500;
`;

export const CustomisedXAxisTick = (props) => {
  const { formatShortest, formatTime } = useDateTime();
  const { x, y, payload } = props;
  const { value } = payload;
  const date = new Date(value);

  return (
    <g transform={`translate(${x},${y})`}>
      <Text x={0} y={9} textAnchor="middle" fill={Colors.darkText} data-testid="text-ch4x">
        {formatShortest(date)}
      </Text>
      <Text
        x={0}
        y={xAxisTickTimeY}
        textAnchor="middle"
        fill={Colors.midText}
        data-testid="text-cydx"
      >
        {formatTime(date)}
      </Text>
    </g>
  );
};

export const CustomisedYAxisTick = (props) => {
  const { x, y, payload, visibleTicksCount, index } = props;
  const { value } = payload;
  let textY = 4;

  // The first and last tick should be aligned with the axis
  if (index === 0) {
    textY = 0;
  }
  if (visibleTicksCount - 1 === index) {
    textY = 8;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <Text x={0} y={textY} textAnchor="end" fill={Colors.darkText} data-testid="text-24h9">
        {value}
      </Text>
    </g>
  );
};
