import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '@tamanu/ui-components';
import { CELL_WIDTHS } from '../constants';
import { Colors } from '../../../constants';


const StyledItemHeader = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 50px 12px 30px;
  border-radius: 4px 4px 0 0;
  border-bottom: 1px solid ${Colors.outline};
`;

const ItemHeadCell = styled(Box)`
  font-size: 14px;
  color: ${props => props.theme.palette.text.tertiary};
  min-width: ${props => props.$width};
  width: ${props => props.$width};
  flex-shrink: 0;

  @media (min-width: 2000px) {
    width: 140px;
    min-width: 140px;
  }
`;

export const InvoiceItemHeader = ({ cellWidths = CELL_WIDTHS }) => {
  return (
    <StyledItemHeader data-testid="styleditemheader-8x5j">
      <ItemHeadCell $width={cellWidths.DATE}>
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </ItemHeadCell>
      <ItemHeadCell style={{ flex: 1 }}>
        <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
      </ItemHeadCell>
      <ItemHeadCell $width={cellWidths.QUANTITY}>
        <TranslatedText stringId="invoice.modal.editInvoice.quantity.label" fallback="Qty" />
      </ItemHeadCell>
      <ItemHeadCell $width={cellWidths.APPROVED}>
        <TranslatedText
          stringId="invoice.modal.editInvoice.approved.label"
          fallback="Approved"
          data-testid="translatedtext-q46f"
        />
      </ItemHeadCell>
      <ItemHeadCell $width={cellWidths.ORDERED_BY}>
        <TranslatedText
          stringId="invoice.modal.editInvoice.orderedBy.label"
          fallback="Ordered by"
          data-testid="translatedtext-b5me"
        />
      </ItemHeadCell>
      <ItemHeadCell $width={cellWidths.PRICE} style={{ textAlign: 'right' }}>
        <TranslatedText stringId="invoice.modal.editInvoice.cost.label" fallback="Cost" />
      </ItemHeadCell>
      <ItemHeadCell $width={cellWidths.NET_COST} style={{ textAlign: 'right' }}>
        <TranslatedText stringId="invoice.modal.editInvoice.netCost.label" fallback="Net cost" />
      </ItemHeadCell>
    </StyledItemHeader>
  );
};
