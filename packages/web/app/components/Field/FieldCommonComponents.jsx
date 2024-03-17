import { InputAdornment } from '@material-ui/core';
import styled, { css } from 'styled-components';
import { Colors } from '../../constants';
import { ChevronIcon } from '../Icons/ChevronIcon';

const iconStyle = css`
  color: ${Colors.darkText};
  margin-left: 6px;
  margin-right: 8px;
`;

export const Icon = styled(InputAdornment)`
  margin-left: 0;
  .MuiSvgIcon-root {
    color: ${Colors.darkText};
  }
`;

export const StyledExpandLess = styled(ChevronIcon)`
  ${iconStyle}
  transform: rotate(180deg);
`;

export const StyledExpandMore = styled(ChevronIcon)`
  ${iconStyle}
`;