import React from 'react';
import styled from 'styled-components';
import { Divider, Button } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation';
import { Price } from './Price';

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

const AddButton = styled(Button)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: -8px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  color: ${props => props.theme.palette.primary.main};
`;

const RemoveButton = styled(Button)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: -8px;
  text-transform: none;
  font-weight: 400;
  font-size: 14px;
  text-decoration: underline;
  &:hover {
    text-decoration: underline;
  }
`;

const SlidingFeeScaleSection = ({ openDiscountModal }) => {
  const feeScaleAdjustment = '-1.00';
  const patientSubtotal = '10.00';

  return (
    <>
      <TotalRow $fontSize="14px">
        <TranslatedText stringId="invoice.summary.patientSubtotal" fallback="Patient subtotal" />
        <Price price={patientSubtotal} data-testid="patient-subtotal" />
      </TotalRow>
      <Divider />
      <Row $indent>
        <TranslatedText
          stringId="invoice.summary.feeScaleAdjustment"
          fallback="Fee scale adjustment"
        />
        <Price price={feeScaleAdjustment} data-testid="fee-scale-adjustment" />
      </Row>
      <Row $indent>
        <AddButton onClick={openDiscountModal}>
          <TranslatedText
            stringId="invoice.summary.removeSlidingFeeScale"
            fallback="Remove sliding fee scale"
          />
        </AddButton>
      </Row>
      <Divider />
    </>
  );
};

export const InvoiceSummaryPanel = ({ invoiceItems, openDiscountModal }) => {
  const { invoiceItemsTotal, insuranceCoverageTotal, patientTotal } = getInvoiceSummary({
    items: invoiceItems,
  });
  const coverageDisplay = insuranceCoverageTotal * -1;
  return (
    <Container>
      <Row>
        <TranslatedText stringId="invoice.summary.invoiceTotal" fallback="Invoice total" />
        <Price price={invoiceItemsTotal} data-testid="translatedtext-828s" />
      </Row>
      <Row>
        <TranslatedText stringId="invoice.summary.insuranceTotal" fallback="Insurance coverage" />
        <Price price={coverageDisplay} data-testid="translatedtext-qedx" />
      </Row>
      <Divider />
      <SlidingFeeScaleSection openDiscountModal={openDiscountModal} />
      <TotalRow>
        <TranslatedText stringId="invoice.summary.patientTotal" fallback="Patient total due" />
        <Price price={patientTotal} data-testid="translatedtext-nst0" />
      </TotalRow>
    </Container>
  );
};
