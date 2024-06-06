import React from 'react';
import { 
  ENCOUNTER_LABELS,
  INVOICE_PAYMENT_STATUS_LABELS,
  INVOICE_STATUS_LABELS 
} from '@tamanu/constants';
import { DataSection } from './DataSection';
import { DataItem } from './DataItem';
import { getLocationName } from '../../patientAccessors';
import { Col } from '../Layout';
import { HorizontalRule } from './HorizontalRule';
import { formatShort } from '../../dateTime';

export const InvoiceDetails = ({ encounter, invoice }) => {
  return (
    <>
      <DataSection title="Invoice details" hideBottomRule>
        <Col>
          <DataItem label="Date" value={formatShort(invoice.createdAt)} />
          <DataItem label="Invoice status" value={INVOICE_STATUS_LABELS[invoice.status]} />
        </Col>
        <Col>
          <DataItem label="Admission" value={ENCOUNTER_LABELS[encounter?.encounterType]} />
          <DataItem label="Payment status" value={INVOICE_PAYMENT_STATUS_LABELS[invoice.paymentStatus]} />
        </Col>
      </DataSection>
    </>
  );
};
