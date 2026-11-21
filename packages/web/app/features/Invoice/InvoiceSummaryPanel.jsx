import React, { useState } from 'react';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import {
  getCoverageTotalBySection,
  getInvoiceDiscountReason,
  getInvoiceSummary,
  isInvoiceEditable,
  isInvoiceSectioned,
} from '@tamanu/utils/invoice';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components';
import { useSettings } from '../../contexts/Settings';
import { useUpdateInvoice } from '../../api/mutations/useInvoiceMutation';
import { Price } from './Price';
import { InvoiceDiscountModal } from './InvoiceDiscountModal/InvoiceDiscountModal';
import { useSectionName } from './InvoiceForm/SectionTitle';

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

const ApplyLinkText = styled.span`
  color: ${Colors.primary};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const DiscountReasonText = styled.div`
  color: ${Colors.midText};
  font-size: 12px;
  font-weight: 400;
  text-wrap: pretty;
`;

const RemoveLinkText = styled.span`
  color: ${Colors.darkestText};
  cursor: pointer;
  font-size: 14px;
  font-weight: 400;
  text-decoration: underline;

  &:hover {
    color: ${Colors.primary};
    font-weight: 500;
  }
`;

// Every listed section shows a line, an uncovered one included, so the sections read in the same
// order as the invoice above. What is left over — coverage on items carrying no section, or one
// the invoice no longer lists — falls to a trailing plain line, shown only when there is any.
const buildSectionCoverageLines = (sections, coverageBySection) => {
  const listed = sections.map(section => ({
    key: section.invoiceSectionId,
    section,
    total: coverageBySection.get(section.invoiceSectionId) ?? 0,
  }));
  const listedIds = new Set(sections.map(section => section.invoiceSectionId));
  const unlisted = [...coverageBySection]
    .filter(([sectionId]) => !listedIds.has(sectionId))
    .reduce((sum, [, total]) => sum + total, 0);
  return unlisted ? [...listed, { key: 'unlabelled', section: null, total: unlisted }] : listed;
};

export const InvoiceSummaryPanel = ({ invoice, patientId }) => {
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const { getSetting } = useSettings();
  const sectionName = useSectionName();
  const isSlidingFeeScaleEnabled = getSetting('features.invoicing.slidingFeeScale');
  const { mutateAsync: updateInvoice } = useUpdateInvoice(invoice);

  const handleUpdateDiscount = async discount => {
    await updateInvoice({ ...invoice, items: invoice.items ?? [], discount });
    setDiscountModalOpen(false);
  };

  const handleRemoveDiscount = async () => {
    await updateInvoice({ ...invoice, items: invoice.items ?? [], discount: null });
  };

  const hasDiscount = Boolean(invoice.discount?.percentage);
  const discountPercentage = invoice.discount?.percentage
    ? Math.round(invoice.discount.percentage * 100)
    : 0;

  const discountReason = getInvoiceDiscountReason(invoice.discount);

  const {
    invoiceItemsUndiscountedTotal,
    itemAdjustmentsTotal,
    insuranceCoverageTotal,
    patientSubtotal,
    discountTotal,
    patientPaymentsTotal,
    patientPaymentRemainingBalance,
  } = getInvoiceSummary(invoice);

  // A split invoice reads its coverage a section at a time, so a section's share can be checked
  // against the plans set on it. Coverage carried by items outside the listed sections keeps the
  // plain line, so every share still adds up to the subtotal below.
  const sections = isInvoiceSectioned(invoice.sections, invoice.items) ? invoice.sections : null;
  const coverageLines = sections
    ? buildSectionCoverageLines(sections, getCoverageTotalBySection(invoice))
    : [{ key: 'invoice', section: null, total: insuranceCoverageTotal }];

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
      {coverageLines.map(({ key, section, total }) => (
        <Row key={key}>
          {section ? (
            <TranslatedText
              stringId="invoice.summary.insuranceTotal.section"
              fallback="Insurance coverage (:section)"
              replacements={{ section: sectionName(section) }}
            />
          ) : (
            <TranslatedText
              stringId="invoice.summary.insuranceTotal"
              fallback="Insurance coverage"
            />
          )}
          <Price
            price={total}
            displayAsNegative
            data-testid={`invoice-summary-insuranceTotal${section ? `-${key}` : ''}`}
          />
        </Row>
      ))}
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
      {isSlidingFeeScaleEnabled && discountReason && (
        <Row $indent>
          <DiscountReasonText data-testid="invoice-summary-discountReason">
            {discountReason.kind === 'recorded' ? (
              discountReason.text
            ) : (
              <TranslatedText
                stringId="invoice.summary.discountReason.assessment"
                fallback="Based on patient assessment"
              />
            )}
          </DiscountReasonText>
        </Row>
      )}
      {isSlidingFeeScaleEnabled && isInvoiceEditable(invoice) && (
        <Row $indent>
          {hasDiscount ? (
            <RemoveLinkText onClick={handleRemoveDiscount}>
              <TranslatedText
                stringId="invoice.summary.removeSlidingFeeScale"
                fallback="Remove sliding fee scale"
              />
            </RemoveLinkText>
          ) : (
            <ApplyLinkText onClick={() => setDiscountModalOpen(true)}>
              <TranslatedText
                stringId="invoice.summary.applySlidingFeeScale"
                fallback="Apply sliding fee scale"
              />
            </ApplyLinkText>
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
          patientId={patientId}
          open={discountModalOpen}
          onClose={() => setDiscountModalOpen(false)}
          handleUpdateDiscount={handleUpdateDiscount}
        />
      )}
    </Container>
  );
};
