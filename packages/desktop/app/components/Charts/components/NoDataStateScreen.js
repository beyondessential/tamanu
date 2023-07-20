import React from 'react';
import { Colors } from '../../../constants';

export const NoDataStateScreen = props => {
  const { height, width, offset, isLoading } = props;
  const { height: offsetHeight, width: offsetWidth, top: offsetTop, left: offsetLeft } = offset; // height and width without Axis

  const screenMarginTopAndBottom = 10;
  const screenWidth = 488;
  let screenHeight = 160;
  const startPointX = (offsetWidth - screenWidth) / 2 + offsetLeft;
  let startPointY = (offsetHeight - screenHeight) / 2 + offsetTop;

  // Chart is too small for the default no data state screen height
  if (
    startPointY <= offsetTop + screenMarginTopAndBottom ||
    startPointY + screenHeight >= offsetHeight + offsetTop
  ) {
    startPointY = offsetTop + screenMarginTopAndBottom;
    screenHeight = offsetHeight - screenMarginTopAndBottom * 2 - 5;
  }
  const textProps = {
    x: offsetWidth / 2 + offsetLeft,
    y: offsetHeight / 2 + offsetTop,
    style: { fontSize: 14, fontWeight: 400, fill: Colors.darkestText },
    textAnchor: 'middle',
  };
  const lineHeight = 18;
  const lineOne = `No recorded vitals to display. To record vitals, please click the`;
  const lineTwo = `'Record vitals' button from the vitals table`;

  const loadingMessage = 'Vitals graph loading...';

  return (
    <svg width={width} height={height}>
      <path
        d={`M${startPointX},${startPointY} h${screenWidth} a3,3 0 0 1 3,3 v${screenHeight} a3,3 0 0 1 -3,3 h-${screenWidth} a3,3 0 0 1 -3,-3 v-${screenHeight} a3,3 0 0 1 3,-3 z`}
        fill={Colors.white}
        stroke={Colors.outline}
        strokeWidth="1"
      />
      {isLoading ? (
        <text {...textProps}>{loadingMessage}</text>
      ) : (
        <>
          <text {...textProps}>{lineOne}</text>
          <text {...textProps} dy={lineHeight}>
            {lineTwo}
          </text>
        </>
      )}
    </svg>
  );
};
