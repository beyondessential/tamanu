import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { Colors } from '../constants';
import { TranslatedText } from './Translation';
import { useApi, useSuggester } from '../api';
import { PencilIcon } from '../assets/icons/PencilIcon';
import { InvoiceManualDiscountModal } from './InvoiceManualDiscountModal';
import { ThemedTooltip } from './Tooltip';
import { Button } from './Button';

const CardItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  align-items: flex-start;
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
  invoiceStatus,
  invoiceDiscountableTotal,
  invoiceNonDiscountableTotal,
}) => {
  const api = useApi();
  const [isOpenManualDiscountModal, setIsOpenManualDiscountModal] = useState(false);
  const [priceChangeId, setPriceChangeId] = useState();
  const [discountInfo, setDiscountInfo] = useState({
    percentageChange: 0,
    description: "",
    orderedById: "",
    date: "",
    orderedByName: "",
  });

  const practitionerSuggester = useSuggester('practitioner');

  useEffect(() => {
    (async () => {
      if (!discountInfo.orderedById) return;
      const { label } = await practitionerSuggester.fetchCurrentOption(discountInfo.orderedById);
      setDiscountInfo(prevDiscountInfo => ({
        ...prevDiscountInfo,
        orderedByName: label,
      }));
    })();
  }, [discountInfo.orderedById]);

  const invoiceTotal = invoiceDiscountableTotal + invoiceNonDiscountableTotal;
  const discountedPrice = invoiceDiscountableTotal * discountInfo.percentageChange;
  const patientTotal = invoiceTotal + discountedPrice;

  useEffect(() => {
    (async () => {
      const { data } = await api.get(`invoices/${invoiceId}/priceChangeItems`);
      if (!data.length) return;
      setDiscountInfo(prevDiscountInfo => ({
        ...prevDiscountInfo,
        percentageChange: data[0].percentageChange,
        description: data[0].description,
        orderedById: data[0].orderedById,
        date: data[0].date,
      }));
      setPriceChangeId(data[0].id);
    })();
  }, [api]);

  const updateDiscountInfo = useCallback(
    (updatedDiscountInfo) => {
      setDiscountInfo(prevDiscountInfo => (
        { ...prevDiscountInfo, ...updatedDiscountInfo }
      ));
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
        {invoiceStatus === INVOICE_STATUSES.IN_PROGRESS && !discountInfo.percentageChange &&
          <Button onClick={() => setIsOpenManualDiscountModal(true)}>
            <TranslatedText
              stringId='invoice.summary.action.addDiscount'
              fallback='Add discount'
            />
          </Button>}
        {!!discountInfo.percentageChange &&
          <DiscountedPrice>
            <span>{(Math.abs(discountInfo.percentageChange) * 100).toFixed(2)}%</span>
            <DiscountedText>
              {(discountedPrice).toFixed(2)}
            </DiscountedText>
          </DiscountedPrice>
        }
      </CardItem>
      <CardItem $marginBottom={-6} $color={Colors.midText} $justifyContent='flex-start'>
        <DescriptionText>
          <ThemedTooltip title={`${discountInfo.orderedByName} ${discountInfo.date}`}>
            <span>{discountInfo.description}</span>
          </ThemedTooltip>
        </DescriptionText>
        {invoiceStatus === INVOICE_STATUSES.IN_PROGRESS && !!discountInfo.percentageChange &&
          <IconButton onClick={() => setIsOpenManualDiscountModal(true)}>
            <PencilIcon />
          </IconButton>}
        <InvoiceManualDiscountModal
          open={isOpenManualDiscountModal}
          onClose={() => setIsOpenManualDiscountModal(false)}
          invoiceId={invoiceId}
          priceChangeId={priceChangeId}
          onUpdateDiscountInfo={updateDiscountInfo}
          description={discountInfo.description}
          percentageChange={discountInfo.percentageChange}
        />
      </CardItem>
      {!!discountInfo.percentageChange &&
        <CardItem $marginBottom={-6} $color={Colors.midText}>
          <TranslatedText
            stringId='invoice.summary.appliedDiscountable'
            fallback='Applied to discountable balance'
          />
          <DiscountedPrice>
            {invoiceDiscountableTotal}
          </DiscountedPrice>
        </CardItem>}
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
