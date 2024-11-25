import React from 'react';
import styled, { css } from 'styled-components';
import { Tooltip } from '@material-ui/core';
import { Colors } from '../constants';

export const ThemedTooltip = styled(props => (
  <Tooltip classes={{ popper: props.className }} placement="top" arrow {...props} />
))`
  .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    font-size: 0.6875rem;
    padding: 0.5rem;
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

export const ConditionalTooltip = ({ visible, children, ...restProps }) => {
  if (!visible) return children;
  return (
    //  Below div is needed to make ThemedTooltip work
    <ThemedTooltip {...restProps}>
      <div>{children}</div>
    </ThemedTooltip>
  );
};
