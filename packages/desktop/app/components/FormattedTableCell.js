import { capitalize } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { formatLong, formatShortest, formatTime } from './DateDisplay';
import { TableTooltip } from './Table/TableTooltip';

// severity constants
const ALERT = 'alert';
const INFO = 'info';

const CellWrapper = styled.div`
  background: ${({ $severity }) => ($severity === ALERT ? `${Colors.alert}20` : 'transparent')};
  border-radius: 10px;
  padding: 8px 14px;
  margin: -8px ${({ $severity }) => ($severity === ALERT ? '0px' : '-14px')};
  width: fit-content;
`;

const ClickableCellWrapper = styled(CellWrapper)`
  cursor: pointer;

  &:hover {
    background: ${({ $severity }) =>
      $severity === ALERT ? `${Colors.alert}40` : Colors.background};
  }
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

export const formatValue = (value, config, isEdited) => {
  const { rounding = 0, unit = '' } = config || {};
  const float = parseFloat(value);

  const formattedValue = isNaN(float)
    ? capitalize(value) || '-'
    : `${float.toFixed(rounding)}${unit && unit.length <= 2 ? unit : ''}`;

  return `${formattedValue}${isEdited ? '*' : ''}`;
};

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

export const RangeValidatedCell = React.memo(
  ({ value, config, validationCriteria, onClick, isEdited, ...props }) => {
    let tooltip = '';
    let severity = INFO;
    const { rounding = 0, unit = '' } = config || {};
    const { normalRange } = validationCriteria || {};
    const float = parseFloat(value);
    const formattedValue = formatValue(value, config, isEdited);

    if (normalRange) {
      const baseTooltip = `Outside normal range\n`;
      if (float < normalRange.min) {
        tooltip = `${baseTooltip} <${normalRange.min}${unit}`;
        severity = ALERT;
      } else if (float > normalRange.max) {
        tooltip = `${baseTooltip} >${normalRange.max}${unit}`;
        severity = ALERT;
      }
    }

    if (!tooltip && unit && unit.length > 2 && !isNaN(float)) {
      // Show full unit in tooltip as its not displayed on table
      tooltip = `${float.toFixed(rounding)}${unit}`;
    }

    const CellContainer = onClick ? ClickableCellWrapper : CellWrapper;

    return tooltip ? (
      <TableTooltip title={tooltip}>
        <CellContainer onClick={onClick} $severity={severity} {...props}>
          {formattedValue}
        </CellContainer>
      </TableTooltip>
    ) : (
      <CellContainer onClick={onClick} {...props}>
        {formattedValue}
      </CellContainer>
    );
  },
);
