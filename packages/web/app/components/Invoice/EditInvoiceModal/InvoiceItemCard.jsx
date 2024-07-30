import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  getInvoiceItemDiscountPriceDisplay,
  getInvoiceItemPriceDisplay,
} from '@tamanu/shared/utils/invoice';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../Translation/TranslatedText';
import { getDateDisplay } from '../../DateDisplay';

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
  color: ${(props) => props.theme.palette.text.tertiary};
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
  color: ${(props) => props.theme.palette.text.secondary};
`;

const PriceText = styled.span`
  margin-right: 16px;
  text-decoration: ${(props) => (props.$isCrossedOut ? 'line-through' : 'none')};
`;

const CardItem = ({ label, value, ...props }) => (
  <CardCell {...props}>
    <CardLabel>{label}</CardLabel>
    <CardValue>{value}</CardValue>
  </CardCell>
);

export const InvoiceItemCard = ({ item }) => {
  const price = getInvoiceItemPriceDisplay(item);
  const discountPrice = getInvoiceItemDiscountPriceDisplay(item);

  return (
    <Card mb={3}>
      <Column>
        <CardItem
          label={<TranslatedText stringId="general.date.label" fallback="Date" />}
          value={item?.orderDate ? getDateDisplay(item?.orderDate, 'dd/MM/yyyy') : ''}
        />
        <CardItem
          label={<TranslatedText stringId="invoice.table.column.code" fallback="Code" />}
          value={item.productCode}
        />
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.modal.editInvoice.orderedBy.label"
              fallback="Ordered by"
            />
          }
          value={item?.orderedByUser?.displayName}
        />
      </Column>
      <Column>
        <CardItem
          label={
            <TranslatedText stringId="invoice.modal.editInvoice.details.label" fallback="Details" />
          }
          value={item.productName}
        />
        <CardItem
          label={
            <TranslatedText
              stringId="invoice.modal.editInvoice.quantity.label"
              fallback="Quantity"
            />
          }
          value={item.quantity}
        />
        <CardItem
          label={
            <TranslatedText stringId="invoice.modal.editInvoice.price.label" fallback="Price" />
          }
          value={
            <>
              <PriceText $isCrossedOut={!!discountPrice}>{price}</PriceText>
              {!!discountPrice && <span>{discountPrice}</span>}
            </>
          }
        />
      </Column>
    </Card>
  );
};
