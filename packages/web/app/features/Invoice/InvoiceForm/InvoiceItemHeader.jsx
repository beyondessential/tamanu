import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '@tamanu/ui-components';

const StyledItemHeader = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 50px 12px 10px;
  border-radius: 4px 4px 0 0;
  border-bottom: 0;
`;

const ItemHeadCell = styled(Box)`
  padding-left: 15px;
  font-size: 14px;
  color: ${props => props.theme.palette.text.tertiary};
`;

export const InvoiceItemHeader = () => {
  return (
    <StyledItemHeader data-testid="styleditemheader-8x5j">
      <ItemHeadCell width="14%">
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </ItemHeadCell>
      <ItemHeadCell width="28%">
        <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
      </ItemHeadCell>
      <ItemHeadCell width="10%">
        <TranslatedText stringId="invoice.table.column.code" fallback="Code" />
      </ItemHeadCell>
      <ItemHeadCell width="10%">
        <TranslatedText stringId="invoice.table.column.quantity" fallback="Quantity" />
      </ItemHeadCell>
      <ItemHeadCell width="19%">
        <TranslatedText
          stringId="invoice.modal.editInvoice.orderedBy.label"
          fallback="Ordered by"
          data-testid="translatedtext-b5me"
        />
      </ItemHeadCell>
      <ItemHeadCell width="11%" sx={{ flexGrow: 1, textAlign: 'right' }}>
        <TranslatedText stringId="invoice.modal.editInvoice.price.label" fallback="Price" />
      </ItemHeadCell>
    </StyledItemHeader>
  );
};
