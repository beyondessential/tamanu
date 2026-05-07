import React from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';

const StyledDraftStatusBadge = styled.span`
  background: ${({ $saved }) => ($saved ? TAMANU_COLORS.safe : TAMANU_COLORS.primary10)};
  border: 1px solid ${({ $saved }) => ($saved ? TAMANU_COLORS.safe : TAMANU_COLORS.primary30)};
  border-radius: 999px;
  color: ${({ $saved }) => ($saved ? TAMANU_COLORS.white : TAMANU_COLORS.primary)};
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1;
  padding: 5px 10px;
  text-transform: uppercase;
  white-space: nowrap;
`;

export function DraftStatusBadge({ isSaved, iteration }) {
  return (
    <StyledDraftStatusBadge $saved={isSaved}>
      {isSaved ? (
        <TranslatedText stringId="general.status.saved" fallback="Saved" />
      ) : iteration > 1 ? (
        <TranslatedText
          stringId="admin.programs.aiFormBuilder.status.draftIteration"
          fallback="Draft :iteration"
          replacements={{ iteration }}
        />
      ) : (
        <TranslatedText stringId="general.status.draft" fallback="Draft" />
      )}
    </StyledDraftStatusBadge>
  );
}
