import React from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation';
import { Price } from './Price';
import { InvoiceDiscountModal } from './InvoiceDiscountModal/InvoiceDiscountModal';

const Container = styled.div`
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 320px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  padding: 10px 12px;
  margin-left: auto;
`;

const CardItem = styled.div`
  display: flex;
  font-size: 14px;
  justify-content: space-between;
  align-items: flex-start;
`;

const TotalCardItem = styled(CardItem)`
  font-size: 16px;
  font-weight: 500;
`;

export const InvoiceSummaryPanel = ({ invoiceItems, invoice }) => {
  const [open, setOpen] = React.useState();
  const { invoiceItemsTotal, insuranceCoverageTotal, patientTotal } = getInvoiceSummary({
    items: invoiceItems,
  });
  const coverageDisplay = insuranceCoverageTotal * -1;

  return (
    <Container>
      <CardItem>
        <TranslatedText stringId="invoice.summary.invoiceTotal" fallback="Invoice total" />
        <Price price={invoiceItemsTotal} data-testid="translatedtext-828s" />
      </CardItem>
      <CardItem>
        <TranslatedText stringId="invoice.summary.insuranceTotal" fallback="Insurance coverage" />
        <Price price={coverageDisplay} data-testid="translatedtext-qedx" />
      </CardItem>
      <Divider />
      <div
        onClick={() => {
          setOpen(true);
        }}
      >
        Apply sliding fee scale
      </div>
      <InvoiceDiscountModal
        open={open}
        invoice={invoice}
        onClose={() => {
          setOpen(false);
        }}
      />
      <TotalCardItem>
        <TranslatedText stringId="invoice.summary.patientTotal" fallback="Patient total due" />
        <Price price={patientTotal} data-testid="translatedtext-nst0" />
      </TotalCardItem>
    </Container>
  );
};
