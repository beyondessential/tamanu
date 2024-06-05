import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { Colors } from '../constants';
import { TranslatedText } from './Translation';
import { useSuggester } from '../api';
import { PencilIcon } from '../assets/icons/PencilIcon';
import { InvoiceManualDiscountModal } from './InvoiceManualDiscountModal';
import { ThemedTooltip } from './Tooltip';
import { BodyText, Heading3 } from './Typography';
import { usePriceChangeItemsQuery } from '../api/queries/usePriceChangeItemsQuery';
import { Button } from './Button';

const CardItem = styled(Box)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  justify-content: space-between;
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

const IconButton = styled.span`
  cursor: pointer;
  position: relative;
  top: 1px;
`;

const DescriptionText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const InvoiceSummaryPanel = ({
  invoiceId,
  invoiceStatus,
  isEditInvoice,
  invoiceTotal
}) => {
  const [isOpenManualDiscountModal, setIsOpenManualDiscountModal] = useState(false);
  const practitionerSuggester = useSuggester('practitioner');
  const { data: priceChangeItemsResponse } = usePriceChangeItemsQuery(invoiceId);

  const discountInfo = priceChangeItemsResponse?.data[0] || {
    percentageChange: 0,
    description: "",
    orderedById: "",
  };

  const discountedPrice = invoiceTotal * Math.abs(discountInfo.percentageChange);
  const patientTotal = invoiceTotal - discountedPrice;

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

  return (
    <Container>
      <CardItem>
        <TranslatedText
          stringId='invoice.summary.subtotal.discountable'
          fallback='Discountable items subtotal'
        />
        <span>{invoiceTotal || '-'}</span>
      </CardItem>
      <CardItem>
        <TranslatedText
          stringId='invoice.summary.subtotal.nondiscountable'
          fallback='Non-discountable items subtotal'
        />
        {/* TODO: Include non-discountable items total */}
        <span>{'-'}</span>
      </CardItem>
      <Divider />
      <CardItem sx={{ fontWeight: 500 }}>
        <TranslatedText stringId="invoice.summary.total.label" fallback="Total" />
        <span>{invoiceTotal || '-'}</span>
      </CardItem>
      {/* TODO: Add insurer contribution */}
      <Divider />
      <CardItem sx={{ marginBottom: '-6px', fontWeight: 500 }}>
        <TranslatedText
          stringId='invoice.summary.discount.label'
          fallback='Discount'
        />
        {invoiceStatus === INVOICE_STATUSES.IN_PROGRESS && !discountInfo.percentageChange && (
          <Button onClick={() => setIsOpenManualDiscountModal(true)}>
            <TranslatedText
              stringId='invoice.summary.action.addDiscount'
              fallback='Add discount'
            />
          </Button>
        )}
        {!!discountInfo.percentageChange && (
          <DiscountedPrice>
            <span>{(Math.abs(discountInfo.percentageChange) * 100).toFixed(2)}%</span>
            <BodyText sx={{ fontWeight: 400 }} color={Colors.darkestText}>
              {discountedPrice.toFixed(2)}
            </BodyText>
          </DiscountedPrice>
        )}
      </CardItem>
      <CardItem
        sx={{
          marginBottom: '-6px',
          color: Colors.midText,
          "&&": { justifyContent: "flex-start" }
        }}
      >
        <DescriptionText>
          <ThemedTooltip title={`${discountInfo.orderedByName} ${discountInfo.date}`}>
            <span>{discountInfo.description}</span>
          </ThemedTooltip>
        </DescriptionText>
        {invoiceStatus === INVOICE_STATUSES.IN_PROGRESS &&
          !!discountInfo.percentageChange &&
          isEditInvoice && (
          <IconButton onClick={() => setIsOpenManualDiscountModal(true)}>
            <PencilIcon />
          </IconButton>
        )}
        <InvoiceManualDiscountModal
          open={isOpenManualDiscountModal}
          onClose={() => setIsOpenManualDiscountModal(false)}
          invoiceId={invoiceId}
          priceChangeId={discountInfo.id}
          description={discountInfo.description}
          percentageChange={discountInfo.percentageChange}
        />
      </CardItem>
      {!!discountInfo.percentageChange && (
        <CardItem sx={{ marginBottom: '-6px', color: Colors.midText }}>
          <TranslatedText
            stringId='invoice.summary.appliedDiscountable'
            fallback='Applied to discountable balance'
          />
          <DiscountedPrice>
            {invoiceTotal}
          </DiscountedPrice>
        </CardItem>
      )}
      <Divider />
      <CardItem>
        <Heading3 sx={{ margin: 0 }}>
          <TranslatedText
            stringId='invoice.summary.patientTotal'
            fallback='Patient total'
          />
        </Heading3>
        <Heading3 sx={{ margin: 0 }}>
          {patientTotal ? patientTotal.toFixed(2) : '-'}
        </Heading3>
      </CardItem>
    </Container>
  );
};
