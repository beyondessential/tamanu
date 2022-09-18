import styled from 'styled-components';
import { Colors } from '../constants';

export const FormSeparatorLine = styled.hr`
  display: block;
  grid-column: 1 / -1;
  border: none;
  border-bottom: 1px solid ${Colors.outline};
  width: 100%;
`;
