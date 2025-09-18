import styled, { css } from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const PaperStyles = css`
  box-shadow: 2px 2px 25px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  background: white;
  border: 1px solid ${TAMANU_COLORS.outline};
`;

export const Paper = styled.div`  
  ${PaperStyles}
`;
