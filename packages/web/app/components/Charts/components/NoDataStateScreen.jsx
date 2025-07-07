import React from 'react';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../Translation/TranslatedText';

const getTextLines = isVital => {
  if (isVital) {
    return {
      lineOne: (
        <TranslatedText
          stringId="charts.noData.vitals.lineOne"
          fallback="No recorded vitals to display for the selected date range. To record"
          data-testid="translatedtext-vitals-line1"
        />
      ),
      lineTwo: (
        <TranslatedText
          stringId="charts.noData.vitals.lineTwo"
          fallback="vitals, please click the 'Record vitals' button from the vitals table."
          data-testid="translatedtext-vitals-line2"
        />
      ),
    };
  }
  return {
    lineOne: (
      <TranslatedText
        stringId="charts.noData.general.lineOne"
        fallback="No recorded entries to display for the selected date range. To record"
        data-testid="translatedtext-general-line1"
      />
    ),
    lineTwo: (
      <TranslatedText
        stringId="charts.noData.general.lineTwo"
        fallback="an entry, please click the 'Record' button from the chart table."
        data-testid="translatedtext-general-line2"
      />
    ),
  };
};

export const NoDataStateScreen = props => {
  const { isVital, height, width, offset, isLoading } = props;
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
  const { lineOne, lineTwo } = getTextLines(isVital);

  const loadingMessage = (
    <TranslatedText
      stringId="charts.loading"
      fallback="Graph loading…"
      data-testid="translatedtext-loading"
    />
  );

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
