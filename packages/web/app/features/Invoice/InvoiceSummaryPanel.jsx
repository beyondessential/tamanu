import React from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation';
import { Heading3 } from '../../components/Typography';
import { Price } from './Price';

const CardItem = styled(Box)`
  display: flex;
  gap: 8px;
  font-size: 14px;
  justify-content: space-between;
  align-items: flex-start;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 450px;
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 16px 20px;
  margin-left: auto;
  background: ${Colors.white};
`;

export const InvoiceSummaryPanel = ({ invoice }) => {
  const { invoiceItemsTotal, insuranceCoverageTotal, patientTotal } = getInvoiceSummary(invoice);

  return (
    <Container>
      <CardItem>
        <TranslatedText
          stringId="invoice.summary.invoiceTotal"
          fallback="Invoice total"
          data-testid="translatedtext-828s"
        />
        <Price price={invoiceItemsTotal} />
      </CardItem>
      <Divider />
      <CardItem>
        <TranslatedText
          stringId="invoice.summary.insuranceTotal"
          fallback="Insurance coverage"
          data-testid="translatedtext-qedx"
        />
        <Price price={`-${insuranceCoverageTotal}`} />
      </CardItem>
      <Divider />
      <CardItem>
        <Heading3 sx={{ margin: 0 }}>
          <TranslatedText
            stringId="invoice.summary.patientTotal"
            fallback="Patient total due"
            data-testid="translatedtext-nst0"
          />
        </Heading3>
        <Heading3 sx={{ margin: 0 }} data-testid="heading3-vj7u">
          <Price price={patientTotal} />
        </Heading3>
      </CardItem>
    </Container>
  );
};
