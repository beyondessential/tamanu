import { capitalize } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { DateDisplay, formatLong, formatShortest, formatTime } from './DateDisplay';
import { TableTooltip } from './Table/TableTooltip';

const CellWrapper = styled.div`
  background: ${({ severity }) =>
    severity === 'alert' ? 'rgba(247, 104, 83, 0.2)' : 'transparent'};
  border-radius: 10px;
  padding: 8px 14px;
  margin: -8px ${({ severity }) => (severity === 'alert' ? '0px' : '-14px')};
  width: fit-content;
`;

const HeadCellWrapper = styled.div`
  display: block;
  width: fit-content;
  div {
    color: ${Colors.midText};
    :first-child {
      color: ${Colors.darkText};
    }
  }
`;

export const DateHeadCell = React.memo(({ value }) => (
  <TableTooltip title={DateDisplay.stringFormat(value, formatLong)}>
    <HeadCellWrapper>
      <div>{DateDisplay.stringFormat(value, formatShortest)}</div>
      <div>{DateDisplay.stringFormat(value, formatTime)}</div>
    </HeadCellWrapper>
  </TableTooltip>
));

export const RangeTooltipCell = React.memo(({ value, config, validationCriteria }) => {
  const { unit = '' } = config || {};
  const { normalRange } = validationCriteria || {};
  const tooltip =
    normalRange && `Normal range ${normalRange.min}${unit} - ${normalRange.max}${unit}`;
  return tooltip ? (
    <TableTooltip title={tooltip}>
      <CellWrapper>{value}</CellWrapper>
    </TableTooltip>
  ) : (
    <CellWrapper>{value}</CellWrapper>
  );
});

export const RangeValidatedCell = React.memo(({ value, config, validationCriteria, ...props }) => {
  let tooltip = '';
  let severity = 'info';
  const { rounding = 0, unit = '' } = config || {};
  const { normalRange } = validationCriteria || {};
  const float = parseFloat(value);
  const formattedValue = isNaN(float)
    ? capitalize(value) || '-'
    : `${float.toFixed(rounding)}${unit && unit.length <= 2 ? unit : ''}`;

  if (normalRange) {
    const baseTooltip = `Outside normal range\n`;
    if (float < normalRange.min) {
      tooltip = `${baseTooltip} <${normalRange.min}${unit}`;
      severity = 'alert';
    } else if (float > normalRange.max) {
      tooltip = `${baseTooltip} >${normalRange.max}${unit}`;
      severity = 'alert';
    }
  }

  if (!tooltip && unit && unit.length > 2 && !isNaN(float)) {
    // Show full unit in tooltip as its not displayed on table
    tooltip = `${float.toFixed(rounding)}${unit}`;
  }
  return tooltip ? (
    <TableTooltip title={tooltip}>
      <CellWrapper severity={severity} {...props}>
        {formattedValue}
      </CellWrapper>
    </TableTooltip>
  ) : (
    <CellWrapper {...props}>{formattedValue}</CellWrapper>
  );
});
