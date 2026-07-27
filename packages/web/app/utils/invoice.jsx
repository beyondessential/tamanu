import React from 'react';
import { isBoolean } from 'es-toolkit/compat';
import styled from 'styled-components';
import { INVOICE_ITEMS_CATEGORIES, INVOICE_ITEMS_CATEGORIES_MODELS } from '@tamanu/constants';
import { TableCellTag, TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../constants';

const BED_FEE_SOURCE_TYPE = INVOICE_ITEMS_CATEGORIES_MODELS[INVOICE_ITEMS_CATEGORIES.BED_FEE];

// A bed-fee line for a location the patient has left is kept at quantity 0 (revivable, and cleaned
// off at finalisation) rather than deleted. Hide those from the invoice view so cashiers don't see
// $0 leftovers; the line is untouched in the data, so it still persists and clears as before.
export const isZeroedBedFeeItem = item =>
  item?.sourceRecordType === BED_FEE_SOURCE_TYPE && Number(item?.quantity) === 0;

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
