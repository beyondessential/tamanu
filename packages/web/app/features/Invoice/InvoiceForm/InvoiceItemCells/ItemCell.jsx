import styled from 'styled-components';
import { Box } from '@mui/material';

export const ItemCell = styled(Box)`
  min-width: ${props => props.$width};
  width: ${props => props.$width};
`;
