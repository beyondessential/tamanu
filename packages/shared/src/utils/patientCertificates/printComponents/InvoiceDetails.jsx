import React from 'react';
import {
  ENCOUNTER_LABELS,
  INVOICE_STATUSES,
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_STATUS_LABELS,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
} from '@tamanu/constants';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { Col } from '../Layout';
import { formatShort } from '../../dateTime';

export const InvoiceDetails = ({ encounter, invoice }) => {
  return (
    <>
      <DataSection title="Invoice details" hideBottomRule>
        <Col>
          <DataItem label="Date" value={formatShort(invoice.date)} />
          <DataItem label="Invoice status" value={INVOICE_STATUS_LABELS[invoice.status]} />
        </Col>
        <Col>
          <DataItem label="Admission" value={ENCOUNTER_LABELS[encounter?.encounterType]} />
          <DataItem
            label="Payment status"
            value={
              invoice.status === INVOICE_STATUSES.FINALISED
                ? INVOICE_PATIENT_PAYMENT_STATUSES_LABELS[invoice.patientPaymentStatus] +
                  (invoice.insurerPaymentStatus === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED
                    ? `/${INVOICE_INSURER_PAYMENT_STATUS_LABELS[invoice.insurerPaymentStatus]}`
                    : '')
                : 'n/a'
            }
          />
        </Col>
      </DataSection>
    </>
  );
};
