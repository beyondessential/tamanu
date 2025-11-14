import React from 'react';
import styled from 'styled-components';
import { TranslatedText } from '@tamanu/ui-components';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';

const StyledItemHeader = styled(Box)`
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
  border: 1px solid ${Colors.outline};
  border-bottom: 0;
`;

const ItemHeadCell = styled(Box)`
  padding-left: 15px;
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
      <ItemHeadCell width="11%" sx={{ flexGrow: 1 }}>
        <TranslatedText stringId="invoice.modal.editInvoice.price.label" fallback="Price" />
      </ItemHeadCell>
    </StyledItemHeader>
  );
};
