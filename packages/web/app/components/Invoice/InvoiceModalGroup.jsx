/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import { INVOICE_MODAL_TYPES } from '../../constants';
import { UpsertInvoiceModal } from './UpsertInvoiceModal';
import { EditInvoiceModal } from './EditInvoiceModal';
import { CancelInvoiceModal } from './CancelInvoiceModal';
import { FinaliseInvoiceModal } from './FinaliseInvoiceModal';

export const InvoiceModalGroup = ({
  initialModalType,
  initialInvoice,
  encounterId,
  onClose,
  isPatientView,
}) => {
  const [invoice, setInvoice] = useState();
  const [invoiceModal, setInvoiceModal] = useState([]);

  useEffect(() => {
    if (initialModalType) {
      handleOpenInvoiceModal(initialModalType);
    }
  }, [initialModalType]);

  useEffect(() => {
    setInvoice(cloneDeep(initialInvoice));
  }, [initialInvoice]);

  const handleCloseInvoiceModal = type => {
    setInvoiceModal(type ? invoiceModal.filter(modal => modal !== type) : []);
    onClose();
  };

  const handleOpenInvoiceModal = (type, keepPreviousModals = false) =>
    setInvoiceModal(keepPreviousModals ? invoiceModal.concat(type) : [type]);

  const handleCreateInvoiceSuccess = () => {
    handleOpenInvoiceModal(INVOICE_MODAL_TYPES.EDIT_INVOICE);
  };

  const handleCancelInvoice = () => {
    handleOpenInvoiceModal(INVOICE_MODAL_TYPES.CANCEL_INVOICE, true);
  };

  const handleFinaliseInvoice = () => {
    handleOpenInvoiceModal(INVOICE_MODAL_TYPES.FINALISE_INVOICE, true);
  };

  return (
    <>
      {invoiceModal.includes(INVOICE_MODAL_TYPES.CREATE_INVOICE) && (
        <UpsertInvoiceModal
          open
          encounterId={encounterId}
          invoice={invoice}
          onClose={() => handleCloseInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE)}
          onCreateSuccess={handleCreateInvoiceSuccess}
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.EDIT_INVOICE) && invoice && (
        <EditInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          handleCancelInvoice={handleCancelInvoice}
          handleFinaliseInvoice={handleFinaliseInvoice}
          isPatientView={isPatientView}
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.CANCEL_INVOICE) && invoice && (
        <CancelInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.FINALISE_INVOICE) && invoice && (
        <FinaliseInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
        />
      )}
    </>
  );
};
