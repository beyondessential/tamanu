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

export const FormTooltip = styled(props => (
  <MuiTooltip classes={{ popper: props.className }} arrow {...props}>
    <StyledInfoIcon />
  </MuiTooltip>
))`
  & .MuiTooltip-tooltip {
    background: white;
    color: ${Colors.midText};
    border: 1px solid ${Colors.outline};
    box-shadow: 0 1px 3px ${Colors.outline};
    font-size: 13px;
    font-weight: 400;
    line-height: 1.7;
    padding: 20px;

    .MuiTooltip-arrow {
      font-size: 18px;
      color: white;

      &:before {
        border: 1px solid ${Colors.outline};
      }
    }
  }
`;
