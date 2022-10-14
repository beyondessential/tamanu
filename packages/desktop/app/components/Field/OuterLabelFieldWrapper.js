import React from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';

import { Colors } from '../../constants';

const OuterLabel = styled.div`
  display: inline-block;
  margin-bottom: 4px;
  color: ${Colors.darkText};
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  letter-spacing: 0;
`;

const OuterLabelRequired = styled.span`
  color: ${Colors.alert};
  padding-left: 3px;
`;

const Icon = styled.i`
  color: ${props => props.color};
  float: right;
  padding-top: 3px;
`;

const StyledTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} {...props}>
    {props.children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
    white-space: pre-line;
    cursor: pointer;
    max-width: 700px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export const OuterLabelFieldWrapper = React.memo(
  React.forwardRef(({ children, required, label, info, style, className }, ref) => (
    <div style={style} className={className} ref={ref}>
      {label && (
        <OuterLabel>
          {label}
          {required && <OuterLabelRequired>*</OuterLabelRequired>}
        </OuterLabel>
      )}
      {info && (
        <StyledTooltip arrow placement="top" title={info}>
          <Icon className="fa fa-info-circle" color={Colors.softText} />
        </StyledTooltip>
      )}
      {children}
    </div>
  )),
);
