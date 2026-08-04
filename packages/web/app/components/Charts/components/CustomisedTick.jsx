import React from 'react';
import styled from 'styled-components';
import { isValid } from 'date-fns';
import { useDateTime } from '@tamanu/ui-components';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { Colors } from '../../../constants';

const TextFontSize = 11;
const xAxisTickDateY = 9;
const xAxisTickSecondaryLineY = 23;
export const customisedXAxisLabelHeight = xAxisTickSecondaryLineY + TextFontSize - 0.5;
export const customisedXAxisDateOnlyLabelHeight = xAxisTickDateY + TextFontSize - 0.5;

const Text = styled.text`
  font-size: ${TextFontSize}px;
  font-weight: 500;
`;

export const CustomisedXAxisTick = (props) => {
  const {
    formatShortest,
    formatTime,
    formatWeekdayShort,
    formatDayMonthYearShort,
    formatMonthYearShort,
  } = useDateTime();
  const { x, y, payload, variant = 'time' } = props;
  const { value } = payload;
  const date = new Date(value);
  if (!isValid(date)) return null;
  const dateString = toDateTimeString(date);

  // 'dayMonthYear' and 'monthYear' are single, differently-formatted lines
  // (e.g. "18 May '26" / "May '26"); every other variant shows the date on
  // the first line, optionally followed by a time or weekday second line.
  const formatSingleLine = { dayMonthYear: formatDayMonthYearShort, monthYear: formatMonthYearShort }[
    variant
  ];
  if (formatSingleLine) {
    return (
      <g transform={`translate(${x},${y})`}>
        <Text x={0} y={xAxisTickDateY} textAnchor="middle" fill={Colors.darkText} data-testid="text-ch4x">
          {formatSingleLine(dateString)}
        </Text>
      </g>
    );
  }

  const formatSecondaryLine = { time: formatTime, weekday: formatWeekdayShort }[variant];

  return (
    <g transform={`translate(${x},${y})`}>
      <Text
        x={0}
        y={xAxisTickDateY}
        textAnchor="middle"
        fill={Colors.darkText}
        data-testid="text-ch4x"
      >
        {formatShortest(dateString)}
      </Text>
      {formatSecondaryLine && (
        <Text
          x={0}
          y={xAxisTickSecondaryLineY}
          textAnchor="middle"
          fill={Colors.midText}
          data-testid="text-cydx"
        >
          {formatSecondaryLine(dateString)}
        </Text>
      )}
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
