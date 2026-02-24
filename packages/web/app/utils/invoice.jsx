import React from 'react';
import { isBoolean } from 'lodash';
import styled from 'styled-components';
import { TableCellTag, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../constants';

const StyledTag = styled(TableCellTag)`
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 18px;
`;

export const getApprovalStatus = approved => {
  if (isBoolean(approved)) {
    return (
      <StyledTag $color={approved ? Colors.green : Colors.alert} noWrap>
        {approved ? (
          <TranslatedText stringId="general.action.yes" fallback="Yes" />
        ) : (
          <TranslatedText stringId="general.action.no" fallback="No" />
        )}
      </StyledTag>
    );
  }

  return null;
};
