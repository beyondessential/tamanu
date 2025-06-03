import React from 'react';
import styled, { css } from 'styled-components';
import { Tooltip } from '@material-ui/core';
import { Colors } from '../constants';

export const ThemedTooltip = styled(props => (
  <Tooltip
    classes={{ popper: props.className }}
    placement="top"
    arrow
    {...props}
    data-testid="tooltip-b4e8"
  />
))`
  .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    font-weight: 400;
    font-size: 0.6875rem;
    padding: 0.375rem 0.5rem;
    text-align: center;
    ${({ $maxWidth }) =>
      $maxWidth &&
      css`
        max-inline-size: ${$maxWidth};
      `}
  }
  .MuiTooltip-arrow {
    color: ${Colors.primaryDark};
  }
`;

export const ConditionalTooltip = ({ visible, children, maxWidth, ...restProps }) => {
  if (!visible) return children;
  return (
    //  Below div is needed to make ThemedTooltip work
    <ThemedTooltip $maxWidth={maxWidth} {...restProps} data-testid="themedtooltip-50xj">
      <div>{children}</div>
    </ThemedTooltip>
  );
};
