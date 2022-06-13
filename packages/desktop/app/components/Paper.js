import styled from 'styled-components';
import { Colors } from '../constants';

export const Paper = styled.div`
  filter: drop-shadow(2px 2px 25px rgba(0, 0, 0, 0.1));
  border-radius: 3px;
  background: white;
  border: 1px solid ${Colors.outline};
`;
