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

const NotApplicable = styled.span`
  padding: 5px 12px;
`;

export const getApprovalStatus = approved => {
  if (isBoolean(approved)) {
    return approved ? (
      <StyledTag $color={Colors.green} noWrap>
        <TranslatedText stringId="general.action.yes" fallback="Yes" />
      </StyledTag>
    ) : null;
  }

  return <NotApplicable>n/a</NotApplicable>;
};
