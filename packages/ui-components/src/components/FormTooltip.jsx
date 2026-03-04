import React from 'react';
import styled from 'styled-components';
import InfoIcon from '@material-ui/icons/Info';
import MuiTooltip from '@material-ui/core/Tooltip';
import { TAMANU_COLORS } from '../constants';

const StyledInfoIcon = styled(InfoIcon)`
  position: absolute;
  right: 0;
  top: 0;
  color: ${TAMANU_COLORS.softText};
  width: 18px;
  height: 18px;
`;

export const FormTooltip = styled(props => (
  <MuiTooltip classes={{ popper: props.className }} arrow {...props} data-testid="muitooltip-s88r">
    <StyledInfoIcon data-testid="styledinfoicon-sg86" />
  </MuiTooltip>
))`
  & .MuiTooltip-tooltip {
    background-color: ${TAMANU_COLORS.primaryDark};
    color: ${TAMANU_COLORS.white};
    text-align: center;
    font-weight: 400;
    padding: 0.375rem 0.5rem;
    font-size: 0.6875rem;
    max-inline-size: 8rem;
    line-height: 1.7;
    & .MuiTooltip-arrow {
      color: ${TAMANU_COLORS.primaryDark};
    }
  }
`;
