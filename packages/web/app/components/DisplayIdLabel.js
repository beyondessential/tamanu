import styled from 'styled-components';
import { Colors } from '../constants';

export const DisplayIdLabel = styled.span`
  background: ${Colors.primary};
  color: ${Colors.secondary};
  padding: 5px;
  border-radius: 3px;
`;

export const TextDisplayIdLabel = styled.span`
  color: ${Colors.primary};
`;

export const InvertedDisplayIdLabel = styled(DisplayIdLabel)`
  background: ${Colors.primary};
  color: ${Colors.white};
  border: 1px solid ${Colors.white};
  border-radius: 3px;
`;
