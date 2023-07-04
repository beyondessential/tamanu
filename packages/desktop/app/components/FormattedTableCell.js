import { capitalize, isNumber } from 'lodash';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { formatLong, formatShortest, formatTime } from './DateDisplay';
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

function round(float, { rounding } = {}) {
  if (isNaN(float) || !isNumber(rounding)) {
    return float;
  }
  return float.toFixed(rounding);
}

function getTooltip(float, config = {}, visibilityCriteria = {}) {
  const { unit } = config;
  const { normalRange } = visibilityCriteria;
  if (normalRange && float < normalRange.min) {
    return {
      tooltip: `Outside normal range\n <${normalRange.min}${unit}`,
      severity: 'alert',
    };
  }
  if (normalRange && float > normalRange.max) {
    return {
      tooltip: `Outside normal range\n >${normalRange.max}${unit}`,
      severity: 'alert',
    };
  }
  if (unit?.length > 2 && !isNaN(float)) {
    return {
      tooltip: `${round(float, config)}${unit}`,
      severity: 'info',
    };
  }
  return {
    severity: 'info',
  };
}

export const DateHeadCell = React.memo(({ value }) => (
  <TableTooltip title={formatLong(value)}>
    <HeadCellWrapper>
      <div>{formatShortest(value)}</div>
      <div>{formatTime(value)}</div>
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
  const float = round(parseFloat(value), config);
  const formattedValue = isNaN(float) ? capitalize(value) : float;
  const { tooltip, severity } = useMemo(() => getTooltip(float, config, validationCriteria), [
    float,
    config,
    validationCriteria,
  ]);
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
