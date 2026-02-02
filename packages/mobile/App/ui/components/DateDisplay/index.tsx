import React from 'react';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';
import { StyledText } from '/styled/common';
import { TextProps } from 'react-native';

interface DateDisplayProps extends TextProps {
  date: string | Date | null | undefined;
  showTime?: boolean;
  showDate?: boolean;
  fallback?: string;
}

export const DateDisplay = ({
  date,
  showTime = false,
  showDate = true,
  fallback = '',
  ...textProps
}: DateDisplayProps) => {
  const { formatShort, formatTime, formatShortDateTime } = useDateTimeFormat();

  const getFormattedValue = () => {
    if (!date) return fallback;
    if (showDate && showTime) return formatShortDateTime(date);
    if (showTime) return formatTime(date);
    return formatShort(date);
  };

  return <StyledText {...textProps}>{getFormattedValue()}</StyledText>;
};

export const TimeDisplay = ({
  date,
  fallback = '',
  ...textProps
}: Omit<DateDisplayProps, 'showTime' | 'showDate'>) => {
  const { formatTime } = useDateTimeFormat();

  return <StyledText {...textProps}>{date ? formatTime(date) : fallback}</StyledText>;
};

export const DateTimeDisplay = ({
  date,
  fallback = '',
  ...textProps
}: Omit<DateDisplayProps, 'showTime' | 'showDate'>) => {
  const { formatShortDateTime } = useDateTimeFormat();

  return <StyledText {...textProps}>{date ? formatShortDateTime(date) : fallback}</StyledText>;
};
