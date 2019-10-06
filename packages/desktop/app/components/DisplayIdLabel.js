import styled from 'styled-components';
import { Colors } from '../constants';

export const DisplayIdLabel = styled.span`
  background: ${Colors.primary};
  color: ${Colors.secondary};
  padding: 5px;
  border-radius: 3px;
`;

export const InvertedDisplayIdLabel = styled(DisplayIdLabel)`
  background: ${Colors.secondary};
  color: ${Colors.primary};
`;
