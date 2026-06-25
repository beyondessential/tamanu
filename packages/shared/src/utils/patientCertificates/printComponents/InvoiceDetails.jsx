import React from 'react';
import {
  ENCOUNTER_TYPE_LABELS,
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
  INVOICE_PATIENT_PAYMENT_STATUSES,
} from '@tamanu/constants';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { useLanguageContext } from '../../pdf/languageContext';
import { useDateTime } from '../../pdf/withDateTimeContext';

const getInvoicePaymentStatus = invoice => {
  const patientPaymentStatus =
    invoice?.patientPaymentStatus ?? INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID;

  const insurerPaymentStatus =
    invoice?.insurerPaymentStatus ?? INVOICE_INSURER_PAYMENT_STATUSES.UNPAID;

  const patientLabel = INVOICE_PATIENT_PAYMENT_STATUSES_LABELS[patientPaymentStatus];
  const insurerLabel = INVOICE_INSURER_PAYMENT_STATUS_LABELS[insurerPaymentStatus];

  return (
    patientLabel +
    (insurerPaymentStatus === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED ? `/${insurerLabel}` : '')
  );
};

export const InvoiceDetails = ({ encounter, invoice, patient, enablePatientInsurer }) => {
  const { getTranslation } = useLanguageContext();
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
            <DataItem
              label={getTranslation('invoice.insurer.label', 'Insurer')}
              value={insurerDisplayValue}
            />
          )}
          <DataItem
            label={getTranslation('invoice.invoiceStatus.label', 'Invoice status')}
            value={INVOICE_STATUS_LABELS[invoice.status]}
          />
          <DataItem
            label={getTranslation('invoice.priceList.label', 'Price list')}
            value={invoice.priceList?.name}
          />
        </Col>
        <Col>
          <DataItem
            label={getTranslation('encounter.admission.label', 'Admission')}
            value={ENCOUNTER_TYPE_LABELS[encounter?.encounterType]}
          />
          {enablePatientInsurer && (
            <DataItem
              label={getTranslation('invoice.policyNumber.label', 'Policy number')}
              value={insurerPolicyNumber}
            />
          )}
          <DataItem
            label={getTranslation('invoice.paymentStatus.label', 'Payment status')}
            value={getInvoicePaymentStatus(invoice)}
          />
          {invoice?.discount?.reason && (
            <DataItem
              label={getTranslation('invoice.discountReason.label', 'Discount reason')}
              value={invoice.discount.reason}
            />
          )}
        </Col>
      </DataSection>
    </>
  );
};
