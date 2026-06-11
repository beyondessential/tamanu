import React from 'react';
import { formatPlainTime } from '@tamanu/utils/dateFormatters';

/**
 * @param {React.DetailedHTMLProps<React.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement> & {
 *   time?: string | null | undefined;
 * }} props
 */
export function PlainTimeDisplay({ time, ...props }) {
  return (
    <time dateTime={time} {...props}>
      {formatPlainTime(time)}
    </time>
  );
}
