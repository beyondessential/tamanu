import React from 'react';
import {
  ENCOUNTER_TYPE_LABELS,
  INVOICE_STATUSES,
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
} from '@tamanu/constants';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { formatShort } from '@tamanu/utils/dateTime';
import { useLanguageContext } from '../../pdf/languageContext';

export const InvoiceDetails = ({ encounter, invoice, patient, enablePatientInsurer }) => {
  const { getTranslation } = useLanguageContext();
  const {
    additionalData: { insurer, insurerPolicyNumber },
  } = patient;
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
          {enablePatientInsurer && (
            <DataItem
              label={getTranslation('invoice.insurer.label', 'Insurer')}
              value={insurer?.name}
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
            value={
              INVOICE_PATIENT_PAYMENT_STATUSES_LABELS[invoice.patientPaymentStatus] +
              (invoice.insurerPaymentStatus === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED
                ? `/${INVOICE_INSURER_PAYMENT_STATUS_LABELS[invoice.insurerPaymentStatus]}`
                : '')
            }
          />
        </Col>
      </DataSection>
    </>
  );
};
