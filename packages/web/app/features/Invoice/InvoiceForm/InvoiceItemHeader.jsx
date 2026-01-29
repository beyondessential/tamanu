import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '@tamanu/ui-components';
import { CELL_WIDTHS } from '../constants';

const StyledItemHeader = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 50px 12px 30px;
  border-radius: 4px 4px 0 0;
  border-bottom: 0;
`;

const ItemHeadCell = styled(Box)`
  font-size: 14px;
  color: ${props => props.theme.palette.text.tertiary};
  min-width: ${props => props.$width};
  width: ${props => props.$width};
  flex-shrink: 0;
`;

export const InvoiceItemHeader = () => {
  return (
    <StyledItemHeader data-testid="styleditemheader-8x5j">
      <ItemHeadCell $width={CELL_WIDTHS.DATE}>
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </ItemHeadCell>
      <ItemHeadCell style={{ flex: 1 }}>
        <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
      </ItemHeadCell>
      <ItemHeadCell $width={CELL_WIDTHS.QUANTITY}>
        <TranslatedText stringId="invoice.table.column.quantity" fallback="Qty" />
      </ItemHeadCell>
      <ItemHeadCell $width={CELL_WIDTHS.APPROVED}>
        <TranslatedText
          stringId="invoice.modal.editInvoice.approved.label"
          fallback="Approved"
          data-testid="translatedtext-q46f"
        />
      </ItemHeadCell>
      <ItemHeadCell $width={CELL_WIDTHS.ORDERED_BY}>
        <TranslatedText
          stringId="invoice.modal.editInvoice.orderedBy.label"
          fallback="Ordered by"
          data-testid="translatedtext-b5me"
        />
      </ItemHeadCell>
      <ItemHeadCell $width={CELL_WIDTHS.PRICE} style={{ textAlign: 'right' }}>
        <TranslatedText stringId="invoice.modal.editInvoice.price.label" fallback="Price" />
      </ItemHeadCell>
    </StyledItemHeader>
  );
};
