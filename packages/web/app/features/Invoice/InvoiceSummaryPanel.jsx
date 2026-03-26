import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components';
import { Price } from './Price';

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

export const InvoiceSummaryPanel = ({ invoice }) => {
  const {
    invoiceItemsUndiscountedTotal,
    itemAdjustmentsTotal,
    insuranceCoverageTotal,
    patientSubtotal,
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
    </Container>
  );
};
