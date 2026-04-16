import React from 'react';
import styled from 'styled-components';

import {
  SelectField,
  TAMANU_COLORS,
  TranslatedText,
  VisibilityStatusChip,
} from '@tamanu/ui-components';

import { Colors } from '../../../constants';

export const Article = styled.article`
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
`;

export const TableScopeHeader = styled.header`
  align-items: flex-end;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: flex;
  gap: 10px;
  padding-block: 16px;
  padding-inline: 24px;
`;

export const TableScopeSelect = styled(SelectField).attrs({
  isClearable: false,
})`
  min-inline-size: 23rem;
`;

export function VisibilityStatusCell({ visibilityStatus }) {
  return visibilityStatus ? (
    <VisibilityStatusChip visibilityStatus={visibilityStatus} />
  ) : (
    <em style={{ color: TAMANU_COLORS.softText }}>
      <TranslatedText stringId="general.none" fallback="None" />
    </em>
  );
}
