import styled, { css } from 'styled-components';
import { Colors } from '../constants';

export const PaperStyles = css`
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  background: white;
  border: 1px solid ${Colors.outline};
`;

export const Paper = styled.div`
  ${PaperStyles}
`;
