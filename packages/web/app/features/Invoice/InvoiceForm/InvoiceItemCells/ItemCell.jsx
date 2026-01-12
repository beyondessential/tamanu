import styled from 'styled-components';
import { Box } from '@mui/material';

export const ItemCell = styled(Box)`
  min-width: ${props => props.$width};
  width: ${props => props.$width};

  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;
