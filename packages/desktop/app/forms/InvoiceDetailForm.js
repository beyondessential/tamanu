import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';
import PrintIcon from '@material-ui/icons/Print';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Colors, INVOICE_PAYMENT_STATUS_OPTIONS, ENCOUNTER_OPTIONS_BY_VALUE } from '../constants';
import { foreignKey } from '../utils/validation';
import { isInvoiceEditable } from '../utils';

import { Form, Field, RadioField, DateField, TextField, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button, TextButton } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../components/Modal';
import { InvoiceDetailTable } from '../components/InvoiceDetailTable';
import { PlusIconButton, MinusIconButton } from '../components';

const InvoiceDetailExpandRow = styled.div`
  margin-top: 20px;
  grid-column: 1 / -1;
  border-top: 1px solid ${Colors.outline};
  padding: 10px 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  div {
    font-weight: 500;
    font-size: 17px;
    color: ${Colors.darkestText};
  }

  button {
    padding: 0;
    color: ${Colors.primary};
  }

  div span {
    font-weight: 200;
    font-size: 14px;
    color: #999999;
  }
`;

const PrintableInvoiceDetailModal = ({ open, onClose, invoice }) => (
  <Modal width="md" title="Invoice detail" open={open} onClose={onClose} printable>
    <h3>
      <span>Invoice number: </span>
      <span>{invoice.displayId}</span>
    </h3>
    <InvoiceDetailTable
      invoice={invoice}
      overrideColumns={['date', 'code', 'category', 'orderedBy', 'price']}
      allowExport={false}
    />
  </Modal>
);

export const InvoiceDetailForm = ({
  onSubmit,
  onFinaliseInvoice,
  onCancelInvoice,
  onCancel,
  invoice,
}) => {
  const [detailExpanded, setDetailExpanded] = useState(false);
  const [finaliseInvoiceModalOpen, setFinaliseInvoiceModalOpen] = useState(false);
  const [cancelInvoiceModalOpen, setCancelInvoiceModalOpen] = useState(false);
  const [printableInvoiceDetailModalOpen, setPrintableInvoiceDetailModalOpen] = useState(false);
  return (
    <>
      <ConfirmModal
        title={`Finalise invoice number: ${invoice.displayId}`}
        text="Are you sure you want to finalise this invoice?"
        subText="You will not be able to edit the invoice once it is finalised."
        confirmButtonColor="primary"
        confirmButtonText="Finalise"
        open={finaliseInvoiceModalOpen}
        onCancel={() => setFinaliseInvoiceModalOpen(false)}
        onConfirm={onFinaliseInvoice}
      />
      <ConfirmModal
        title={`Cancel invoice number: ${invoice.displayId}`}
        text="Are you sure you want to cancel this invoice?"
        subText="You will not be able to edit the invoice once it is cancelled."
        confirmButtonColor="primary"
        confirmButtonText="Cancel Invoice"
        open={cancelInvoiceModalOpen}
        onCancel={() => setCancelInvoiceModalOpen(false)}
        onConfirm={onCancelInvoice}
      />
      <PrintableInvoiceDetailModal
        open={printableInvoiceDetailModalOpen}
        onClose={() => setPrintableInvoiceDetailModalOpen(false)}
        invoice={invoice}
      />
      <Form
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <FormGrid>
            <Field
              name="paymentStatus"
              label="Payment status"
              required
              component={RadioField}
              options={INVOICE_PAYMENT_STATUS_OPTIONS}
            />
            <Field name="total" label="Total ($)" disabled required component={NumberField} />
            <Field
              name="date"
              label="Date"
              disabled
              required
              component={DateField}
              saveDateAsString
            />
            <Field name="admissionType" label="Admission type" disabled component={TextField} />
            <Field name="receiptNumber" label="Receipt number" component={TextField} />
            <ButtonRow>
              {isInvoiceEditable(invoice) ? (
                <>
                  <Button variant="outlined" onClick={onCancel} color="primary">
                    Cancel
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setFinaliseInvoiceModalOpen(true)}
                    color="primary"
                  >
                    Finalise
                  </Button>
                </>
              ) : null}
              <Button variant="contained" onClick={submitForm} color="primary">
                Save
              </Button>
            </ButtonRow>
          </FormGrid>
        )}
        initialValues={{
          date: getCurrentDateTimeString(),
          ...invoice,
          admissionType: invoice.admissionType
            ? ENCOUNTER_OPTIONS_BY_VALUE[invoice.admissionType].label
            : '',
        }}
        validationSchema={yup.object().shape({
          status: foreignKey('Status is required'),
        })}
      />
      <InvoiceDetailExpandRow>
        <div>View invoice details</div>
        <TextButton onClick={() => setPrintableInvoiceDetailModalOpen(true)}>
          <span>
            <PrintIcon />
          </span>
          <span> Print Invoice</span>
        </TextButton>
        {detailExpanded ? (
          <MinusIconButton onClick={() => setDetailExpanded(false)} />
        ) : (
          <PlusIconButton onClick={() => setDetailExpanded(true)} />
        )}
      </InvoiceDetailExpandRow>
      <Collapse in={detailExpanded}>
        <InvoiceDetailTable
          invoice={invoice}
          overrideColumns={['date', 'code', 'category', 'orderedBy', 'price']}
          allowExport={false}
        />
      </Collapse>
    </>
  );
};
