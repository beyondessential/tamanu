import React from 'react';
import styled from 'styled-components';
import InfoIcon from '@material-ui/icons/Info';
import MuiTooltip from '@material-ui/core/Tooltip';
import { Colors } from '../constants';

const StyledInfoIcon = styled(InfoIcon)`
  position: absolute;
  right: 0;
  top: 0;
  color: ${Colors.softText};
  width: 18px;
  height: 18px;
`;

export const FormTooltip = styled((props) => (
  <MuiTooltip classes={{ popper: props.className }} arrow {...props} data-testid="muitooltip-s88r">
    <StyledInfoIcon data-testid="styledinfoicon-sg86" />
  </MuiTooltip>
))`
  z-index: 1500;
  pointer-events: auto;
  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    text-align: center;
    font-weight: 400;
    padding: 0.5rem 0.625rem;
    font-size: 0.6875rem;
    max-inline-size: 8rem;
    line-height: 1.7;
     & .MuiTooltip-arrow {
      color: ${Colors.primaryDark};
    }
  }
`;
