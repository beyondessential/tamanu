import React from 'react';
import styled from 'styled-components';
import { TranslatedText, VisuallyHidden } from '@tamanu/ui-components';
import { CELL_WIDTHS } from '../constants';

const StyledItemHeader = styled.thead`
  border-block-end: 1px solid ${p => p.theme.palette.divider};
  border-start-end-radius: inherit;
  border-start-start-radius: inherit;
  padding: 12px 50px 12px 30px;
`;

const ItemHeadCell = styled.th.attrs({ scope: 'col' })`
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 14px;
  font-weight: 400;
`;

export const InvoiceItemHeader = ({ cellWidths = CELL_WIDTHS }) => {
  return (
    <StyledItemHeader data-testid="styleditemheader-8x5j">
      <ItemHeadCell>
        <VisuallyHidden>
          <TranslatedText
            stringId="invoice.toggleInsurancePlanAdjustments"
            fallback="Toggle insurance plan adjustments"
          />
        </VisuallyHidden>
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.DATE }}>
        <TranslatedText stringId="general.date.label" fallback="Date" />
      </ItemHeadCell>
      <ItemHeadCell
        style={{
          inlineSize: '100%',
          minInlineSize: cellWidths.DETAILS,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.QUANTITY }}>
        <TranslatedText stringId="invoice.modal.editInvoice.qty.label" fallback="Qty" />
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.APPROVED }}>
        <TranslatedText stringId="invoice.modal.editInvoice.approved.label" fallback="Approved" />
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.ORDERED_BY }}>
        <TranslatedText
          stringId="invoice.modal.editInvoice.orderedBy.label"
          fallback="Ordered by"
        />
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.PRICE, textAlign: 'end' }}>
        <TranslatedText stringId="invoice.modal.editInvoice.cost.label" fallback="Cost" />
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.NET_COST, textAlign: 'end' }}>
        <TranslatedText stringId="invoice.modal.editInvoice.netCost.label" fallback="Net cost" />
      </ItemHeadCell>
      <ItemHeadCell style={{ minInlineSize: cellWidths.ACTIONS, textAlign: 'end' }}>
        <VisuallyHidden>
          <TranslatedText stringId="general.actions.label" fallback="Actions" />
        </VisuallyHidden>
      </ItemHeadCell>
    </StyledItemHeader>
  );
};
