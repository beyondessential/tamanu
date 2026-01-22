import React from 'react';
import { Svg } from './Svg';

export const SendIcon = ({ htmlColor = 'currentcolor', width = 24, height = 24, ...props }) => (
  <Svg width={width} height={height} {...props} data-testid="svg-send">
    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill={htmlColor} />
  </Svg>
);
