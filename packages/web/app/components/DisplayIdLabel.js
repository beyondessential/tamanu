import styled from 'styled-components';
import { TAMANU_COLORS } from '@tamanu/ui-components';

export const DisplayIdLabel = styled.span`
  background: ${TAMANU_COLORS.primary};
  color: ${TAMANU_COLORS.secondary};
  padding: 5px;
  border-radius: 3px;
`;

export const TextDisplayIdLabel = styled.span`
  color: ${TAMANU_COLORS.primary};
`;

export const InvertedDisplayIdLabel = styled(DisplayIdLabel)`
  background: ${TAMANU_COLORS.primary};
  color: ${TAMANU_COLORS.white};
  border: 1px solid ${TAMANU_COLORS.white};
  border-radius: 3px;
`;
