import React from 'react';
import { INVOICE_MODAL_TYPES } from '../../constants';
import { CancelInvoiceModal } from './CancelInvoiceModal';
import { FinaliseInvoiceModal } from './FinaliseInvoiceModal';
import { DeleteInvoiceModal } from './DeleteInvoiceModal';
import { InvoiceInsuranceModal } from './InvoiceInsuranceModal';
import { InvoiceRecordModal } from '../../components/PatientPrinting/modals/InvoiceRecordModal';

export const InvoiceModalGroup = ({ invoice, invoiceModalType, setOpenInvoiceModal }) => {
  const handleCloseInvoiceModal = () => setOpenInvoiceModal(null);

  return (
    <>
      {invoiceModalType === INVOICE_MODAL_TYPES.INSURANCE && (
        <InvoiceInsuranceModal
          open
          invoice={invoice}
          onClose={() => handleCloseInvoiceModal()}
          data-testid="upsertinvoicemodal-wt5z"
        />
      )}
      {invoiceModalType === INVOICE_MODAL_TYPES.CANCEL_INVOICE && (
        <CancelInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          data-testid="cancelinvoicemodal-zrjt"
        />
      )}
      {invoiceModalType === INVOICE_MODAL_TYPES.DELETE_INVOICE && (
        <DeleteInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          data-testid="deleteinvoicemodal-s0jy"
        />
      )}
      {invoiceModalType === INVOICE_MODAL_TYPES.FINALISE_INVOICE && (
        <FinaliseInvoiceModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          data-testid="finaliseinvoicemodal-d1cy"
        />
      )}
      {invoiceModalType === INVOICE_MODAL_TYPES.PRINT && (
        <InvoiceRecordModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          data-testid="invoicerecordmodal-ep8b"
        />
      )}
    </>
  );
};
