import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components';
import { useSettings } from '../../contexts/Settings';
import { useUpdateInvoice } from '../../api/mutations/useInvoiceMutation';
import { Price } from './Price';
import { InvoiceDiscountModal } from './InvoiceDiscountModal/InvoiceDiscountModal';

const Container = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding: 8px 12px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 4px;
  padding-bottom: 4px;
  margin-left: ${props => (props.$indent ? '16px' : 0)};
  font-weight: ${props => (props.$bold ? '500' : '400')};
  font-size: ${props => (props.$total ? '16px' : '14px')};
  margin-top: ${props => (props.$total ? '5px' : 0)};
`;

const LinkText = styled.span`
  color: ${Colors.primary};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

export const InvoiceSummaryPanel = ({ invoice }) => {
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const { getSetting } = useSettings();
  const isSlidingFeeScaleEnabled = getSetting('features.invoicing.slidingFeeScale');
  const { mutate: updateInvoice } = useUpdateInvoice(invoice);

  const handleUpdateDiscount = discount => {
    updateInvoice(
      { ...invoice, items: invoice.items ?? [], discount },
      { onSuccess: () => setDiscountModalOpen(false) },
    );
  };

  const handleRemoveDiscount = () => {
    updateInvoice({ ...invoice, items: invoice.items ?? [], discount: null });
  };

  const hasDiscount = !!invoice.discount?.percentage;
  const discountPercentage = invoice.discount?.percentage
    ? Math.round(invoice.discount.percentage * 100)
    : 0;

  const {
    invoiceItemsUndiscountedTotal,
    itemAdjustmentsTotal,
    insuranceCoverageTotal,
    patientSubtotal,
    discountTotal,
    patientPaymentsTotal,
    patientPaymentRemainingBalance,
  } = getInvoiceSummary(invoice);

  return (
    <Container>
      <Row>
        <TranslatedText stringId="invoice.summary.invoiceTotal" fallback="Invoice total" />
        <Price price={invoiceItemsUndiscountedTotal} data-testid="invoice-summary-invoiceTotal" />
      </Row>
      <Row>
        <TranslatedText stringId="invoice.summary.itemAdjustments" fallback="Item adjustments" />
        <Price price={itemAdjustmentsTotal} data-testid="invoice-summary-itemAdjustments" />
      </Row>
      <Row>
        <TranslatedText stringId="invoice.summary.insuranceTotal" fallback="Insurance coverage" />
        <Price
          price={insuranceCoverageTotal}
          displayAsNegative
          data-testid="invoice-summary-insuranceTotal"
        />
      </Row>
      <Divider />
      <Row $bold>
        <TranslatedText stringId="invoice.summary.patientSubtotal" fallback="Patient subtotal" />
        <Price price={patientSubtotal} data-testid="invoice-summary-patientSubtotal" />
      </Row>
      <Divider />
      {isSlidingFeeScaleEnabled && hasDiscount && (
        <Row $indent>
          <TranslatedText
            stringId="invoice.summary.feeScaleAdjustment"
            fallback="Fee scale adjustment - :percentage%"
            replacements={{ percentage: discountPercentage }}
          />
          <Price
            price={discountTotal}
            displayAsNegative
            data-testid="invoice-summary-discountTotal"
          />
        </Row>
      )}
      {isSlidingFeeScaleEnabled && (
        <Row $indent>
          {hasDiscount ? (
            <LinkText onClick={handleRemoveDiscount}>
              <TranslatedText
                stringId="invoice.summary.removeSlidingFeeScale"
                fallback="Remove sliding fee scale"
              />
            </LinkText>
          ) : (
            <LinkText onClick={() => setDiscountModalOpen(true)}>
              <TranslatedText
                stringId="invoice.summary.applySlidingFeeScale"
                fallback="Apply sliding fee scale"
              />
            </LinkText>
          )}
        </Row>
      )}
      <Row $indent>
        <TranslatedText stringId="invoice.summary.patientPayments" fallback="Patient payments" />
        <Price
          price={patientPaymentsTotal}
          displayAsNegative
          data-testid="invoice-summary-patientPayments"
        />
      </Row>
      <Divider />
      <Row $total $bold>
        <TranslatedText stringId="invoice.summary.patientTotal" fallback="Patient total due" />
        <Price price={patientPaymentRemainingBalance} data-testid="invoice-summary-patientTotal" />
      </Row>
      {isSlidingFeeScaleEnabled && (
        <InvoiceDiscountModal
          open={discountModalOpen}
          onClose={() => setDiscountModalOpen(false)}
          handleUpdateDiscount={handleUpdateDiscount}
        />
      )}
    </Container>
  );
};
