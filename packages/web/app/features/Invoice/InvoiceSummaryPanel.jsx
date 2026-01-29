import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation';
import { Price } from './Price';

const Container = styled.div`
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: ${props => props.$width};
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding: 10px 12px;
`;

const Row = styled.div`
  display: flex;
  font-size: 14px;
  justify-content: space-between;
  align-items: flex-start;
  margin-left: ${props => (props.$indent ? '16px' : 0)};
`;

const TotalRow = styled(Row)`
  font-size: ${({ $fontSize = '16px' }) => $fontSize};
  font-weight: 500;
`;

export const InvoiceSummaryPanel = ({ invoice }) => {
  const {
    invoiceItemsTotal,
    insuranceCoverageTotal,
    patientPaymentsTotal,
    patientPaymentRemainingBalance,
  } = getInvoiceSummary(invoice);

  const coverageDisplay = insuranceCoverageTotal > 0 ? insuranceCoverageTotal * -1 : 0;
  const patientPaymentsTotalDisplay = patientPaymentsTotal > 0 ? patientPaymentsTotal * -1 : 0;

  return (
    <Container>
      <Row>
        <TranslatedText stringId="invoice.summary.invoiceTotal" fallback="Invoice total" />
        <Price price={invoiceItemsTotal} data-testid="invoice-summary-invoiceTotal" />
      </Row>
      <Row>
        <TranslatedText stringId="invoice.summary.insuranceTotal" fallback="Insurance coverage" />
        <Price price={coverageDisplay} data-testid="invoice-summary-insuranceTotal" />
      </Row>
      <Row>
        <TranslatedText stringId="invoice.summary.patientPayments" fallback="Patient payments" />
        <Price price={patientPaymentsTotalDisplay} data-testid="invoice-summary-patientPayments" />
      </Row>
      <Divider />
      <TotalRow>
        <TranslatedText stringId="invoice.summary.patientTotal" fallback="Patient total due" />
        <Price price={patientPaymentRemainingBalance} data-testid="translatedtext-nst0" />
      </TotalRow>
    </Container>
  );
};
