import styled from 'styled-components';
import { Box } from '@mui/material';

export const ItemCell = styled(Box)`
  min-width: ${props => props.$width};
  width: ${props => props.$width};

  @media (min-width: 2000px) {
    width: 140px;
    min-width: 140px;
  }
`;
