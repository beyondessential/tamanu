import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider, Button } from '@material-ui/core';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { useSettings } from '@tamanu/ui-components';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation';
import { Price } from './Price';
import { InvoiceDiscountModal } from './InvoiceDiscountModal/InvoiceDiscountModal';
import { useUpdateInvoice } from '../../api/mutations/useInvoiceMutation';

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

const AddDiscountButton = styled(Button)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: -8px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  color: ${props => props.theme.palette.primary.main};
`;

const RemoveDiscountButton = styled(Button)`
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

const SlidingFeeScaleSection = ({
  invoice,
  discountTotal,
  patientSubtotal,
  discountPercentage,
}) => {
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const { mutate: updateInvoice } = useUpdateInvoice(invoice);

  const onClose = () => {
    setDiscountModalOpen(false);
  };

  const onOpen = () => {
    setDiscountModalOpen(true);
  };

  const handleUpdateDiscount = discountData => {
    updateInvoice({ ...invoice, discount: discountData });
    onClose();
  };

  const handleRemoveDiscount = () => {
    updateInvoice({ ...invoice, discount: null });
    onClose();
  };

  const inProgress = invoice.status === INVOICE_STATUSES.IN_PROGRESS;
  const discountDisplay = discountTotal > 0 ? discountTotal * -1 : 0;

  return (
    <>
      <TotalRow $fontSize="14px">
        <TranslatedText stringId="invoice.summary.patientSubtotal" fallback="Patient subtotal" />
        <Price price={patientSubtotal} data-testid="patient-subtotal" />
      </TotalRow>
      <Divider />
      <Row $indent>
        <span>
          <TranslatedText
            stringId="invoice.summary.feeScaleAdjustment"
            fallback="Fee scale adjustment"
          />
          {discountPercentage && ` - ${discountPercentage * 100}%`}
        </span>
        <Price price={discountDisplay} data-testid="fee-scale-adjustment" />
      </Row>
      {inProgress && (
        <Row $indent>
          {discountTotal ? (
            <RemoveDiscountButton onClick={handleRemoveDiscount}>
              <TranslatedText
                stringId="invoice.summary.removeSlidingFeeScale"
                fallback="Remove sliding fee scale"
              />
            </RemoveDiscountButton>
          ) : (
            <AddDiscountButton onClick={onOpen}>
              <TranslatedText
                stringId="invoice.summary.applySlidingFeeScale"
                fallback="Apply sliding fee scale"
              />
            </AddDiscountButton>
          )}
        </Row>
      )}
      <Divider />
      <InvoiceDiscountModal
        open={discountModalOpen}
        onClose={onClose}
        onSubmit={handleUpdateDiscount}
      />
    </>
  );
};

export const InvoiceSummaryPanel = ({ invoice }) => {
  const { getSetting } = useSettings();
  const slidingFeeScaleEnabled = getSetting('features.invoicing.slidingFeeScale');
  const invoiceItems = invoice.items;
  const invoiceDiscount = invoice.discount;

  const {
    invoiceItemsTotal,
    insuranceCoverageTotal,
    patientTotal,
    patientSubtotal,
    discountTotal,
  } = getInvoiceSummary({
    items: invoiceItems,
    discount: slidingFeeScaleEnabled ? invoiceDiscount : null,
  });
  const coverageDisplay = insuranceCoverageTotal > 0 ? insuranceCoverageTotal * -1 : 0;

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
      {slidingFeeScaleEnabled && (
        <SlidingFeeScaleSection
          patientSubtotal={patientSubtotal}
          discountTotal={discountTotal}
          discountPercentage={invoiceDiscount?.percentage}
          invoice={invoice}
        />
      )}
      <TotalRow>
        <TranslatedText stringId="invoice.summary.patientTotal" fallback="Patient total due" />
        <Price price={patientTotal} data-testid="translatedtext-nst0" />
      </TotalRow>
    </Container>
  );
};
