import React from 'react';
import { INVOICE_MODAL_TYPES } from '../../constants';
import { CancelInvoiceModal } from './CancelInvoiceModal';
import { FinaliseInvoiceModal } from './FinaliseInvoiceModal';
import { DeleteInvoiceModal } from './DeleteInvoiceModal';
import { InvoiceItemsModal } from './InvoiceItemsModal';
import { InvoicePatientDetailsModal } from './InvoicePatientDetailsModal';
import { InvoiceRecordModal } from '../../components/PatientPrinting/modals/InvoiceRecordModal';
import { TranslatedText } from '@tamanu/ui-components';
import { INVOICE_FORM_TYPE } from './constants.js';
import { INSURANCE_PLAN_ENTRY, InsurancePlanFlow } from './InsurancePlanFlow';
import { useInvoicePatientDetailsAccess } from './useInvoicePatientDetailsAccess';

export const InvoiceModalGroup = ({ invoice, invoiceModalType, section, setOpenInvoiceModal }) => {
  const { isPatientDetailsEditable } = useInvoicePatientDetailsAccess(invoice);

  const handleCloseInvoiceModal = () => setOpenInvoiceModal(null);

  return (
    <>
      {invoiceModalType === INVOICE_MODAL_TYPES.PATIENT_DETAILS && (
        <InvoicePatientDetailsModal
          open
          editable={isPatientDetailsEditable}
          onClose={handleCloseInvoiceModal}
          onSaved={handleCloseInvoiceModal}
        />
      )}
      {invoiceModalType === INVOICE_MODAL_TYPES.INSURANCE && (
        <InsurancePlanFlow
          invoice={invoice}
          open
          entry={INSURANCE_PLAN_ENTRY.PICKER}
          onClose={handleCloseInvoiceModal}
          onApplied={handleCloseInvoiceModal}
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
      {invoiceModalType === INVOICE_MODAL_TYPES.EDIT_ITEMS && (
        <InvoiceItemsModal
          open
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          title={<TranslatedText stringId="invoice.modal.edit.title" fallback="Edit invoice" />}
          invoiceFormType={INVOICE_FORM_TYPE.EDIT_ITEMS}
          data-testid="editinvoiceitemsmodal-x7zy"
        />
      )}
      {invoiceModalType === INVOICE_MODAL_TYPES.ADD_ITEMS && (
        <InvoiceItemsModal
          open
          title={<TranslatedText stringId="invoice.modal.addItems.title" fallback="Add items" />}
          invoiceFormType={INVOICE_FORM_TYPE.ADD_ITEMS}
          onClose={() => handleCloseInvoiceModal()}
          invoice={invoice}
          section={section}
          data-testid="addinvoiceitemsmodal-x7zy"
        />
      )}
    </>
  );
};
