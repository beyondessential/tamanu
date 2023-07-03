import { capitalize } from 'lodash';
import React, { useRef, useState, useEffect } from 'react';
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

export const DateHeadCell = React.memo(({ value }) => (
  <TableTooltip title={formatLong(value)}>
    <HeadCellWrapper>
      <div>{formatShortest(value)}</div>
      <div>{formatTime(value)}</div>
    </HeadCellWrapper>
  </TableTooltip>
));

const LimitedLinesCellWrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${props => props.maxLines};
`;

export const LimitedLinesCell = ({ value, maxLines = 2 }) => {
  const contentRef = useRef(null);
  const [isClamped, setClamped] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // isClamped logic from: https://stackoverflow.com/a/74255034/11324801
  useEffect(() => {
    const handleResize = () => {
      if (contentRef && contentRef.current) {
        setClamped(contentRef.current.scrollHeight > contentRef.current.clientHeight);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <TableTooltip
      title={value}
      open={isClamped && tooltipOpen}
      onOpen={() => setTooltipOpen(true)}
      onClose={() => setTooltipOpen(false)}
    >
      <LimitedLinesCellWrapper ref={contentRef} maxLines={maxLines}>
        {value}
      </LimitedLinesCellWrapper>
    </TableTooltip>
  );
};

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
