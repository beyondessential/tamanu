import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { Colors } from '../constants';
import { TranslatedText } from './Translation';
import { useApi } from '../api';
import { PencilIcon } from '../assets/icons/PencilIcon';
import { InvoiceManualDiscountModal } from './InvoiceManualDiscountModal';
import { ThemedTooltip } from './Tooltip';

const CardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: ${p => p.$justifyContent ? p.$justifyContent : 'space-between'};
  ${p => p.$marginBottom ? `margin-bottom: ${p.$marginBottom}px;` : ''}
  ${p => p.$fontWeight ? `font-weight: ${p.$fontWeight};` : ''}
  ${p => p.$color ? `color: ${p.$color};` : ''}
  ${p => p.$fontSize ? `font-size: ${p.$fontSize};` : ''}
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 382px;
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 8px 16px;
  margin-left: auto;
  background: ${Colors.white};
`;

const DiscountedPrice = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100px;
`;

const DiscountedText = styled.span`
  font-weight: 400;
`;

const IconButton = styled.span`
  cursor: pointer;
  position: relative;
  top: 1px;
`;

const DescriptionText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
}
`;

export const InvoiceSummaryPanel = ({
  invoiceId,
  invoiceDiscountableTotal,
  invoiceNonDiscountableTotal,
}) => {
  const api = useApi();
  const [percentageChange, setPercentageChange] = useState(0);
  const [description, setDescription] = useState('');
  const [isOpenManualDiscountModal, setIsOpenManualDiscountModal] = useState(false);
  const [priceChangeId, setPriceChangeId] = useState();
  const invoiceTotal = invoiceDiscountableTotal + invoiceNonDiscountableTotal;
  const discountedPrice = invoiceDiscountableTotal * percentageChange;
  const patientTotal = invoiceTotal + discountedPrice;

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`invoices/${invoiceId}/priceChangeItems`);
      if (!data.length) return;
      setPercentageChange(data[0].percentageChange);
      setDescription(data[0].description);
      setPriceChangeId(data[0].id);
    })();
  }, [api]);

  const updatePercentageChangeAndReason = useCallback(
    ({ percentageChange, reason }) => {
      setPercentageChange(percentageChange);
      setDescription(reason);
    }, []);

  return (
    <Container>
      <CardItem>
        <TranslatedText
          stringId='invoice.summary.subtotal.discountable'
          fallback='Discountable items subtotal'
        />
        <span>{invoiceDiscountableTotal}</span>
      </CardItem>
      <CardItem>
        <TranslatedText
          stringId='invoice.summary.subtotal.nondiscountable'
          fallback='Non-discountable items subtotal'
        />
        <span>{invoiceNonDiscountableTotal}</span>
      </CardItem>
      <Divider />
      <CardItem $fontWeight={500}>
        <TranslatedText stringId="invoice.summary.total.label" fallback="Total" />
        <span>{invoiceTotal}</span>
      </CardItem>
      {/* TODO: Add insurer contribution */}
      <Divider />
      <CardItem $marginBottom={-6} $fontWeight={500}>
        <TranslatedText
          stringId='invoice.summary.discount.label'
          fallback='Discount'
        />
        <DiscountedPrice>
          <span>{(Math.abs(percentageChange) * 100).toFixed(2)}%</span>
          <DiscountedText>
            {(discountedPrice).toFixed(2)}
          </DiscountedText>
        </DiscountedPrice>
      </CardItem>
      <CardItem $marginBottom={-6} $color={Colors.midText} $justifyContent='flex-start'>
        <DescriptionText>
          <ThemedTooltip title={description}>
            <span>{description}</span>
          </ThemedTooltip>
        </DescriptionText>
        <IconButton onClick={() => setIsOpenManualDiscountModal(true)}>
          <PencilIcon />
        </IconButton>
        <InvoiceManualDiscountModal
          open={isOpenManualDiscountModal}
          onClose={() => setIsOpenManualDiscountModal(false)}
          invoiceId={invoiceId}
          priceChangeId={priceChangeId}
          onUpdatePercentageChangeAndReason={updatePercentageChangeAndReason}
          description={description}
          percentageChange={percentageChange}
        />
      </CardItem>
      <CardItem $marginBottom={-6} $color={Colors.midText}>
        <TranslatedText
          stringId='invoice.summary.appliedDiscountable'
          fallback='Applied to discountable balance'
        />
        <DiscountedPrice>
          {invoiceDiscountableTotal}
        </DiscountedPrice>
      </CardItem>
      <Divider />
      <CardItem $fontWeight={500} $fontSize='18px'>
        <TranslatedText
          stringId='invoice.summary.patientTotal'
          fallback='Patient total'
        />
        <span>{patientTotal.toFixed(2)}</span>
      </CardItem>
    </Container>
  );
};
