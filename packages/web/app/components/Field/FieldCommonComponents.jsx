import { InputAdornment } from '@material-ui/core';
import styled from 'styled-components';
import { Colors } from '../../constants';
import { ChevronIcon } from '../Icons';

export const Icon = styled(InputAdornment)`
  margin-inline-start: 0;
  .MuiSvgIcon-root {
    color: ${Colors.darkText};
  }
`;

export const ExpandMoreIcon = styled(ChevronIcon)`
  transform: rotate(0);
  transition: transform 184ms ease-in-out;
`;

export const ExpandLessIcon = styled(ExpandMoreIcon)`
  transform: rotate(180deg);
`;
