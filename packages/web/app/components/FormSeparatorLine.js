import styled from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const FormSeparatorLine = styled.hr`
  display: block;
  grid-column: 1 / -1;
  border: none;
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
  width: 100%;
`;
