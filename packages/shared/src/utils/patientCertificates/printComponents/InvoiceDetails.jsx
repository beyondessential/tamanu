import React from 'react';
import {
  ENCOUNTER_TYPE_LABELS,
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUS_LABELS,
  INVOICE_PATIENT_PAYMENT_STATUSES,
} from '@tamanu/constants';
import { getInvoiceDiscountReason } from '@tamanu/utils/invoice';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { useLanguageContext } from '../../pdf/languageContext';
import { useDateTime } from '../../pdf/withDateTimeContext';

const getInvoicePaymentStatus = (invoice, getEnumTranslation) => {
  const patientPaymentStatus =
    invoice?.patientPaymentStatus ?? INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID;

  const insurancePlanPaymentStatus =
    invoice?.insurancePlanPaymentStatus ?? INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.UNPAID;

  const patientLabel = getEnumTranslation(
    INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
    patientPaymentStatus,
  );
  const insurancePlanLabel = getEnumTranslation(
    INVOICE_INSURANCE_PLAN_PAYMENT_STATUS_LABELS,
    insurancePlanPaymentStatus,
  );

  return (
    patientLabel +
    (insurancePlanPaymentStatus === INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.REJECTED ? `/${insurancePlanLabel}` : '')
  );
};

export const InvoiceDetails = ({ encounter, invoice, patient, enablePatientInsurer }) => {
  const { getTranslation, getEnumTranslation } = useLanguageContext();
  const { formatShort } = useDateTime();

  const invoiceInsurancePlans = invoice?.insurancePlans || [];
  const hasInvoicePlans = invoiceInsurancePlans.length > 0;
  const insurancePlanNames = invoiceInsurancePlans.map(p => p.name || p.code).join(', ');

  // Fall back to legacy patient-level insurer when no invoice plans are present
  const {
    additionalData: { insurer, insurerPolicyNumber },
  } = patient;

  const showInsurer = hasInvoicePlans || enablePatientInsurer;
  const insurerDisplayValue = hasInvoicePlans ? insurancePlanNames : insurer?.name;
  // The one row covers two different things, so it has to say which it is showing.
  const insurerLabel = hasInvoicePlans
    ? getTranslation('invoice.insurancePlan.label', 'Insurance plan')
    : getTranslation('general.localisedField.insurer.label', 'Insurer');

  const discountReason = getInvoiceDiscountReason(invoice?.discount);
  const discountReasonValue =
    discountReason?.kind === 'recorded'
      ? discountReason.text
      : discountReason &&
        getTranslation('invoice.summary.discountReason.assessment', 'Based on patient assessment');

  return (
    <>
      <DataSection
        title={getTranslation('pdf.invoiceDetails.title', 'Invoice details')}
        hideBottomRule
      >
        <Col>
          <DataItem
            label={getTranslation('general.date.label', 'Date')}
            value={formatShort(invoice.date)}
          />
          {showInsurer && (
            <DataItem label={insurerLabel} value={insurerDisplayValue} />
          )}
          <DataItem
            label={getTranslation('invoice.invoiceStatus.label', 'Invoice status')}
            value={getEnumTranslation(INVOICE_STATUS_LABELS, invoice.status)}
          />
          <DataItem
            label={getTranslation('invoice.priceList.label', 'Price list')}
            value={invoice.priceList?.name}
          />
        </Col>
        <Col>
          <DataItem
            label={getTranslation('encounter.admission.label', 'Admission')}
            value={getEnumTranslation(ENCOUNTER_TYPE_LABELS, encounter?.encounterType)}
          />
          {enablePatientInsurer && (
            <DataItem
              label={getTranslation('invoice.policyNumber.label', 'Policy number')}
              value={insurerPolicyNumber}
            />
          )}
          <DataItem
            label={getTranslation('invoice.paymentStatus.label', 'Payment status')}
            value={getInvoicePaymentStatus(invoice, getEnumTranslation)}
          />
          {discountReasonValue && (
            <DataItem
              label={getTranslation('invoice.discountReason.label', 'Discount reason')}
              value={discountReasonValue}
            />
          )}
        </Col>
      </DataSection>
    </>
  );
};
