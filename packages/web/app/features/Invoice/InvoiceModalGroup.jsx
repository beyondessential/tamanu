/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import { INVOICE_MODAL_TYPES } from '../../constants';
import { UpsertInvoiceModal } from './UpsertInvoiceModal';
import { CancelInvoiceModal } from './CancelInvoiceModal';
import { FinaliseInvoiceModal } from './FinaliseInvoiceModal';
import { DeleteInvoiceModal } from './DeleteInvoiceModal';
import { InvoiceInsuranceModal } from './InvoiceInsuranceModal';

export const InvoiceModalGroup = ({
  initialModalType,
  initialInvoice,
  encounterId,
  onClose,
  afterDeleteInvoice,
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
    const isCloseAll = !type;
    setInvoiceModal(isCloseAll ? [] : invoiceModal.filter(modal => modal !== type));
    if (isCloseAll) {
      onClose();
    }
  };

  const handleOpenInvoiceModal = (type, keepPreviousModals = false) =>
    setInvoiceModal(keepPreviousModals ? invoiceModal.concat(type) : [type]);

  const handleTemporaryUpdateInvoice = data => {
    setInvoice({ ...invoice, ...data });
  };

  return (
    <>
      {invoiceModal.includes(INVOICE_MODAL_TYPES.CREATE_INVOICE) && (
        <UpsertInvoiceModal
          open
          encounterId={encounterId}
          invoice={invoice}
          onClose={() => {
            if (invoiceModal.length === 1) {
              return handleCloseInvoiceModal();
            }
            handleCloseInvoiceModal(INVOICE_MODAL_TYPES.CREATE_INVOICE);
          }}
          onTemporaryUpdate={handleTemporaryUpdateInvoice}
          data-testid="upsertinvoicemodal-wt5z"
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.INSURANCE) && (
        <InvoiceInsuranceModal
          open
          encounterId={encounterId}
          invoice={invoice}
          onClose={handleCloseInvoiceModal}
          data-testid="upsertinvoicemodal-wt5z"
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.CANCEL_INVOICE) && invoice && (
        <CancelInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          data-testid="cancelinvoicemodal-zrjt"
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.DELETE_INVOICE) && invoice && (
        <DeleteInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          onDeleteSuccess={afterDeleteInvoice}
          data-testid="deleteinvoicemodal-s0jy"
        />
      )}
      {invoiceModal.includes(INVOICE_MODAL_TYPES.FINALISE_INVOICE) && invoice && (
        <FinaliseInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          data-testid="finaliseinvoicemodal-d1cy"
        />
      )}
    </>
  );
};
