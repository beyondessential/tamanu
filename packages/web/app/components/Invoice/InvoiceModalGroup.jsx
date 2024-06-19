/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { INVOICE_MODAL_TYPES } from '../../constants';
import { UpsertInvoiceModal } from './UpsertInvoiceModal';
import { EditInvoiceModal } from './EditInvoiceModal';
import { CancelInvoiceModal } from './CancelInvoiceModal';

export const InvoiceModalGroup = ({ encounterId, initialState }) => {
  const [invoice, setInvoice] = useState();
  const [invoiceModal, setInvoiceModal] = useState([]);

  useEffect(() => {
    if (initialState) {
      handleOpenInvoiceModal(initialState.type);
      setInvoice(initialState.invoice);
    }
  }, [initialState]);

  const handleCloseInvoiceModal = type =>
    setInvoiceModal(type ? invoiceModal.filter(modal => modal !== type) : []);

  const handleOpenInvoiceModal = (type, keepPreviousModals = false) =>
    setInvoiceModal(keepPreviousModals ? invoiceModal.concat(type) : [type]);

  const handleEditDiscount = () => {
    handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE, true);
  };

  const onUpdateInvoice = data => {
    setInvoice({ ...invoice, ...data });
  };

  return (
    <>
      {invoiceModal.includes(INVOICE_MODAL_TYPES.CREATE_INVOICE) && (
        <UpsertInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE)}
          encounterId={encounterId}
          invoice={invoice}
          onUpdate={onUpdateInvoice}
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.EDIT_INVOICE) && invoice && (
        <EditInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          handleEditDiscount={handleEditDiscount}
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.CANCEL_INVOICE) && invoice && (
        <CancelInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal(INVOICE_MODAL_TYPES.CANCEL_INVOICE)}
          onCancelSuccess={() => handleCloseInvoiceModal()}
          invoice={invoice}
        />
      )}
    </>
  );
};
