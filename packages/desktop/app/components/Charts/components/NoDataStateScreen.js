import React from 'react';
import { Colors } from '../../../constants';

export const NoDataStateScreen = props => {
  const { height, width, offset } = props;
  const { height: offsetHeight, width: offsetWidth, top: offsetTop, left: offsetLeft } = offset; // height and width without Axis

  const screenWidth = 488;
  const screenHeight = 160;
  const startPointX = (offsetWidth - screenWidth) / 2 + offsetLeft;
  const startPointY = (offsetHeight - screenHeight) / 2 + offsetTop;

  const textProps = {
    x: offsetWidth / 2 + offsetLeft,
    y: offsetHeight / 2 + offsetTop,
    style: { fontSize: 14, fontWeight: 400, fill: Colors.darkestText },
    textAnchor: 'middle',
  };
  const lineHeight = 18;
  const lineOne = `No recorded vitals to display. To record vitals,`;
  const lineTwo = `please click the 'Record vitals' button from the`;
  const lineThree = `vitals table`;

  return (
    <svg width={width} height={height}>
      <path
        d={`M${startPointX},${startPointY} h${screenWidth} a3,3 0 0 1 3,3 v${screenHeight} a3,3 0 0 1 -3,3 h-${screenWidth} a3,3 0 0 1 -3,-3 v-${screenHeight} a3,3 0 0 1 3,-3 z`}
        fill={Colors.white}
        stroke={Colors.outline}
        strokeWidth="1"
      />
      <text {...textProps}>{lineOne}</text>
      <text {...textProps} dy={lineHeight}>
        {lineTwo}
      </text>
      <text {...textProps} dy={lineHeight * 2}>
        {lineThree}
      </text>
    </svg>
  );
};
