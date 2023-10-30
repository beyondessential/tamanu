import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';
import { Colors } from '../constants';

export const ThemedTooltip = styled(props => {
  return <Tooltip classes={{ popper: props.className }} placement="top" arrow {...props} />;
})`
  ${props => props.customCss}
  .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    padding: 8px;
    font-size: 11px;
    font-weight: 400;
    width: 150px;
    text-align: center;
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
