import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { getDateDisplay } from '../../../components/DateDisplay';

const Card = styled(Box)`
  background: white;
  border-radius: 5px;
  border: 1px solid ${Colors.outline};
  padding: 20px 10px;
  display: flex;
  align-items: flex-start;
  margin-top: 10px;
`;

const Column = styled.div`
  flex: 1;
  padding-left: 20px;

  :first-of-type {
    border-right: 1px solid ${Colors.outline};
  }
`;

const CardCell = styled.div`
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CardLabel = styled.div`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

const PriceText = styled.span`
  margin-right: 16px;
  text-decoration: ${props => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props} data-testid="cardcell-qkvv">
    <CardLabel data-testid="cardlabel-erof">{label}</CardLabel>
    <CardValue data-testid="cardvalue-cngq">{value}</CardValue>
  </CardCell>
);

export const InvoiceItemCard = ({ item }) => {
  const price = getInvoiceItemPriceDisplay(item);
  const discountPrice = getInvoiceItemDiscountPriceDisplay(item);

  return (
    <Card mb={3} data-testid="card-bvae">
      <Column data-testid="column-ckh6">
        <CardItem
          label={
            <TranslatedText
              stringId="general.date.label"
              fallback="Date"
              data-testid="translatedtext-dz71"
            />
          }
          value={item?.orderDate ? getDateDisplay(item?.orderDate, 'dd/MM/yyyy') : ''}
          data-testid="carditem-v4wj"
        />
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.table.column.code"
              fallback="Code"
              data-testid="translatedtext-9lm0"
            />
          }
          value={item.productCodeFinal ?? item.productCode}
          data-testid="carditem-fvcd"
        />
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.modal.editInvoice.orderedBy.label"
              fallback="Ordered by"
              data-testid="translatedtext-31ub"
            />
          }
          value={item?.orderedByUser?.displayName}
          data-testid="carditem-daqa"
        />
      </Column>
      <Column data-testid="column-az90">
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.modal.editInvoice.details.label"
              fallback="Details"
              data-testid="translatedtext-qh0h"
            />
          }
          value={item.productNameFinal ?? item.product?.name}
          data-testid="carditem-pohl"
        />
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.modal.editInvoice.quantity.label"
              fallback="Quantity"
              data-testid="translatedtext-kozc"
            />
          }
          value={item.quantity}
          data-testid="carditem-ml9p"
        />
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.modal.editInvoice.price.label"
              fallback="Price"
              data-testid="translatedtext-ryyv"
            />
          }
          value={
            <>
              <PriceText $isCrossedOut={!!discountPrice} data-testid="pricetext-4vhj">
                {price}
              </PriceText>
              {!!discountPrice && <span>{discountPrice}</span>}
            </>
          }
          data-testid="carditem-cusg"
        />
      </Column>
    </Card>
  );
};
