import { useTheme } from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import { isNumber } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { EditedOrnament, PlainTimeDisplay } from '@tamanu/ui-components';
import { Colors } from '../constants';
import { DateDisplay, TimeDisplay } from './DateDisplay';
import { TableTooltip } from './Table/TableTooltip';

// severity constants
const ALERT = 'alert';
const INFO = 'info';

const CellWrapper = styled.div`
  border-radius: 10px;
  margin-block: -6px;
  margin-inline: -11px;
  padding-block: 6px;
  padding-inline: 11px;
  width: fit-content;

  ${p =>
    p.$severity === ALERT &&
    css`
      background-color: oklch(from ${Colors.alert} l c h / 12.5%);
    `}
`;

const ClickableCellWrapper = styled(CellWrapper)`
  cursor: pointer;
  ${p =>
    p.$severity === ALERT &&
    css`
      &:hover {
        background-color: oklch(from ${Colors.alert} l c h / 25%);
      }
    `}
`;

const HeadCellWrapper = styled.div`
  display: block;
  width: fit-content;
`;

function round(float, { rounding } = {}) {
  const floatNumber = parseFloat(float);
  if (isNaN(floatNumber) || !isNumber(rounding)) {
    return float;
  }

  return floatNumber.toFixed(rounding);
}

function getValidationState(float, config = {}, visibilityCriteria = {}) {
  const { unit = '' } = config;
  const { normalRange } = visibilityCriteria;

  if (!float && float !== 0) {
    return {
      severity: INFO,
    };
  }

  if (normalRange && float < normalRange.min) {
    return {
      tooltip: `Outside normal range\n <${normalRange.min}${unit}`,
      severity: ALERT,
    };
  }
  if (normalRange && float > normalRange.max) {
    return {
      tooltip: `Outside normal range\n >${normalRange.max}${unit}`,
      severity: ALERT,
    };
  }
  if (unit?.length > 2 && !isNaN(float)) {
    return {
      tooltip: `${round(float, config)}${unit}`,
      severity: INFO,
    };
  }
  return {
    severity: INFO,
  };
}

export const formatValue = (value, config) => {
  const { rounding = 0, unit = '' } = config || {};
  const float = Number.parseFloat(value);

  if (isNaN(float)) {
    return value || '—'; // em dash
  }

  const unitSuffix = unit && unit.length <= 2 ? unit : '';
  if (rounding > 0 || rounding === 0) {
    return `${float.toFixed(rounding)}${unitSuffix}`;
  }
  return `${float}${unitSuffix}`;
};

export const DateHeadCell = ({ value }) => {
  const theme = useTheme();
  return (
    <TableTooltip
      title={<DateDisplay date={value} format="long" />}
      data-testid="tabletooltip-5w9x"
    >
      <HeadCellWrapper data-testid="headcellwrapper-jcsy">
        <DateDisplay
          date={value}
          format="shortest"
          noTooltip
          style={{ color: theme.palette.text.secondary, display: 'block' }}
        />
        <TimeDisplay
          date={value}
          noTooltip
          style={{ color: theme.palette.text.tertiary, display: 'block' }}
        />
      </HeadCellWrapper>
    </TableTooltip>
  );
};

export const DateBodyCell = ({ value, onClick }) => {
  const CellContainer = onClick ? ClickableCellWrapper : CellWrapper;
  return (
    <TableTooltip
      title={<DateDisplay date={value} timeFormat="default" />}
      data-testid="tabletooltip-3knb"
    >
      <CellContainer onClick={onClick} data-testid="cellcontainer-slh4">
        <DateDisplay date={value} format="shortest" noTooltip style={{ display: 'block' }} />
        <TimeDisplay date={value} noTooltip style={{ display: 'block' }} />
      </CellContainer>
    </TableTooltip>
  );
};

export function TimeBodyCell({ value, onClick }) {
  const CellContainer = onClick ? ClickableCellWrapper : CellWrapper;
  return (
    <CellContainer onClick={onClick} data-testid="cellcontainer-time">
      <PlainTimeDisplay time={value} />
    </CellContainer>
  );
}

const LimitedLinesCellWrapper = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  ${({ maxLines, isOneLine }) =>
    maxLines <= 1 && !isOneLine
      ? ''
      : `
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: ${isOneLine ? 1 : maxLines};
  `}
  ${({ maxWidth }) => maxWidth && `max-width: ${maxWidth};`};
`;

const LimitedLinesCellContainer = styled.div`
  display: flex;
  align-items: flex-end;
`;

export const LimitedLinesCell = ({
  value,
  maxWidth,
  maxLines = 2,
  isOneLine = false,
  disableTooltip = false,
  isEdited = false,
  ...tooltipProps
}) => {
  const contentRef = useRef(null);
  const [isClamped, setClamped] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // isClamped logic inspired by: https://stackoverflow.com/a/74255034/11324801
  useEffect(() => {
    const handleResize = () => {
      if (contentRef && contentRef.current) {
        const { scrollHeight, clientHeight, scrollWidth, clientWidth } = contentRef.current;
        setClamped(scrollHeight > clientHeight || scrollWidth > clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  const renderLimitedLinesCellWrapper = () => {
    return (
      <LimitedLinesCellWrapper
        ref={contentRef}
        maxLines={maxLines}
        maxWidth={maxWidth}
        isOneLine={isOneLine}
        data-testid="limitedlinescellwrapper-imvw"
      >
        {value}
      </LimitedLinesCellWrapper>
    );
  };

  if (disableTooltip) {
    return renderLimitedLinesCellWrapper();
  }

  return (
    <LimitedLinesCellContainer>
      <TableTooltip
        title={value ?? ''}
        open={isClamped && tooltipOpen}
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        data-testid="tabletooltip-fs9r"
        {...tooltipProps}
      >
        {renderLimitedLinesCellWrapper()}
      </TableTooltip>
      {isEdited && isClamped && <EditedOrnament />}
    </LimitedLinesCellContainer>
  );
};

export const RangeTooltipCell = React.memo(({ value, config, validationCriteria }) => {
  const { unit = '' } = config || {};
  const { normalRange } = validationCriteria || {};
  const tooltip =
    normalRange && `Normal range ${normalRange.min}${unit} – ${normalRange.max}${unit}`;
  return tooltip ? (
    <TableTooltip title={tooltip} data-testid="tabletooltip-0d49">
      <CellWrapper data-testid="cellwrapper-27nt">{value}</CellWrapper>
    </TableTooltip>
  ) : (
    <CellWrapper data-testid="cellwrapper-wc2u">{value}</CellWrapper>
  );
});

const DefaultWrapper = ({ value }) => <>{value}</>;

export const RangeValidatedCell = React.memo(
  ({
    value,
    config,
    validationCriteria,
    onClick,
    isEdited,
    ValueWrapper = DefaultWrapper,
    ...props
  }) => {
    const CellContainer = onClick ? ClickableCellWrapper : CellWrapper;
    const float = round(value, config);
    const { tooltip, severity } = useMemo(
      () => getValidationState(float, config, validationCriteria),
      [float, config, validationCriteria],
    );

    const cell = (
      <CellContainer
        onClick={onClick}
        $severity={severity}
        {...props}
        data-testid="cellcontainer-4zzh"
      >
        <ValueWrapper
          value={
            <>
              {formatValue(value, config)}
              {isEdited && <EditedOrnament />}
            </>
          }
          isEdited={isEdited}
          data-testid="valuewrapper-nbfj"
        />
      </CellContainer>
    );

    return tooltip ? (
      <TableTooltip title={tooltip} data-testid="tabletooltip-vgtq">
        {cell}
      </TableTooltip>
    ) : (
      cell
    );
  },
);
