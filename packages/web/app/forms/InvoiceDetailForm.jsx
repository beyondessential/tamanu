import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Collapse from '@material-ui/core/Collapse';
import PrintIcon from '@material-ui/icons/Print';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { Colors, ENCOUNTER_OPTIONS_BY_VALUE, FORM_TYPES, INVOICE_PAYMENT_STATUS_OPTIONS } from '../constants';
import { foreignKey } from '../utils/validation';
import { isInvoiceEditable } from '../utils';

import { DateField, Field, Form, NumberField, RadioField, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button, FormCancelButton, FormSubmitButton, TextButton } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { ConfirmModal } from '../components/ConfirmModal';
import { Modal } from '../components/Modal';
import { InvoiceDetailTable } from '../components/InvoiceDetailTable';
import { MinusIconButton, PlusIconButton } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';

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
  <Modal
    width="md"
    title={<TranslatedText stringId="invoice.modal.print.title" fallback="Invoice detail" />}
    open={open}
    onClose={onClose}
    printable
  >
    <h3>
      <span>
        <TranslatedText stringId="invoice.modal.print.subHeading" fallback="Invoice number" />:{' '}
      </span>
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
        title={
          <TranslatedText
            stringId="invoice.modal.view.finalise.title"
            fallback="Finalise invoice number: :invoiceNumber"
            replacements={{ invoiceNumber: invoice.displayId }}
          />
        }
        text={
          <TranslatedText
            stringId="invoice.modal.view.finalise.text"
            fallback="Are you sure you want to finalise this invoice?"
          />
        }
        subText={
          <TranslatedText
            stringId="invoice.modal.view.finalise.subText"
            fallback="You will not be able to edit the invoice once it is finalised."
          />
        }
        confirmButtonColor="primary"
        confirmButtonText={
          <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
        }
        open={finaliseInvoiceModalOpen}
        onCancel={() => setFinaliseInvoiceModalOpen(false)}
        onConfirm={onFinaliseInvoice}
      />
      <ConfirmModal
        title={`${(
          <TranslatedText
            stringId="invoice.modal.view.cancel.title"
            fallback="Cancel invoice number"
          />
        )}: ${invoice.displayId}`}
        text={
          <TranslatedText
            stringId="invoice.modal.view.cancel.text"
            fallback="Are you sure you want to cancel this invoice?"
          />
        }
        subText={
          <TranslatedText
            stringId="invoice.modal.view.cancel.subText"
            fallback="You will not be able to edit the invoice once it is cancelled."
          />
        }
        confirmButtonColor="primary"
        confirmButtonText={
          <TranslatedText stringId="invoice.action.cancelInvoice" fallback="Cancel Invoice" />
        }
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
              label={
                <TranslatedText
                  stringId="invoice.modal.view.form.paymentStatus.label"
                  fallback="Payment status"
                />
              }
              required
              component={RadioField}
              options={INVOICE_PAYMENT_STATUS_OPTIONS}
            />
            <Field
              name="total"
              label={
                <TranslatedText
                  stringId="invoice.modal.view.form.total.label"
                  fallback="Total ($)"
                />
              }
              disabled
              required
              component={NumberField}
            />
            <Field
              name="date"
              label={<TranslatedText stringId="general.form.date.label" fallback="Date" />}
              disabled
              required
              component={DateField}
              saveDateAsString
            />
            <Field
              name="admissionType"
              label={
                <TranslatedText
                  stringId="invoice.modal.view.form.admissionType.label"
                  fallback="Admission type"
                />
              }
              disabled
              component={TextField}
            />
            <Field
              name="receiptNumber"
              label={
                <TranslatedText
                  stringId="invoice.modal.view.form.receiptNumber.label"
                  fallback="Receipt number"
                />
              }
              component={TextField}
            />
            <ButtonRow>
              {isInvoiceEditable(invoice) ? (
                <>
                  <FormCancelButton onClick={onCancel}>
                    <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                  </FormCancelButton>
                  <Button
                    variant="outlined"
                    onClick={() => setFinaliseInvoiceModalOpen(true)}
                    color="primary"
                  >
                    <TranslatedText stringId="general.action.finalise" fallback="Finalise" />
                  </Button>
                </>
              ) : null}
              <FormSubmitButton variant="contained" onClick={submitForm} color="primary">
                <TranslatedText stringId="general.action.save" fallback="Save" />
              </FormSubmitButton>
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
        formType={FORM_TYPES.EDIT_DATA_FORM}
        validationSchema={yup.object().shape({
          status: foreignKey('Status is required'),
        })}
      />
      <InvoiceDetailExpandRow>
        <div>
          <TranslatedText
            stringId="invoice.modal.view.expanded.title"
            fallback="View invoice details"
          />
        </div>
        <TextButton onClick={() => setPrintableInvoiceDetailModalOpen(true)}>
          <span>
            <PrintIcon />
          </span>
          <span>
            <TranslatedText stringId="invoice.action.printInvoice" fallback="Print Invoice" />
          </span>
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
