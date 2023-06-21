import React from 'react';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { formatShortest, formatTime } from '../../DateDisplay';

const Text = styled.text`
  font-size: 11px;
  font-weight: 500;
`;

export const CustomisedXAxisTick = props => {
  const { x, y, payload } = props;
  const { value } = payload;

  return (
    <g transform={`translate(${x},${y})`}>
      <Text x={0} y={9} textAnchor="middle" fill={Colors.darkText}>
        {formatShortest(value)}
      </Text>
      <Text x={0} y={23} textAnchor="middle" fill={Colors.midText}>
        {formatTime(value)}
      </Text>
    </g>
  );
};

export const CustomisedYAxisTick = props => {
  const { x, y, payload, visibleTicksCount, index } = props;
  const { value } = payload;
  let textY = 4;
  if (index === 0) {
    textY = 0;
  }
  if (visibleTicksCount - 1 === index) {
    textY = 8;
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <Text x={0} y={textY} textAnchor="end" fill={Colors.darkText}>
        {value}
      </Text>
    </g>
  );
};
