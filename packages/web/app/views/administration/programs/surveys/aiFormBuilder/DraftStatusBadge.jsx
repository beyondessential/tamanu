import React from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';

const StyledDraftStatusBadge = styled.span`
  background: ${({ $saved }) => ($saved ? TAMANU_COLORS.safe : TAMANU_COLORS.primary10)};
  border: 1px solid ${({ $saved }) => ($saved ? TAMANU_COLORS.safe : TAMANU_COLORS.primary30)};
  border-radius: 999px;
  color: ${({ $saved }) => ($saved ? TAMANU_COLORS.white : TAMANU_COLORS.primary)};
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1;
  padding: 4px 8px;
  text-transform: uppercase;
  white-space: nowrap;
`;

export function DraftStatusBadge({ isSaved }) {
  return (
    <StyledDraftStatusBadge $saved={isSaved}>
      {isSaved ? (
        <TranslatedText stringId="general.status.saved" fallback="Saved" />
      ) : (
        <TranslatedText stringId="general.status.draft" fallback="Draft" />
      )}
    </StyledDraftStatusBadge>
  );
}
