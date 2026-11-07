import React from 'react';
import { ASSET_NAMES, INVOICE_PRINT_LAYOUTS } from '@tamanu/constants';
import { ForbiddenError } from '@tamanu/errors';
import { useDateTime } from '@tamanu/ui-components';

import {
  InvoiceReceiptPrintout,
  InvoiceRecordPrintout,
} from '@tamanu/shared/utils/patientCertificates';
import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';
import { combineQueries } from '../../../api/combineQueries';
import { useReferenceDataQuery } from '../../../api/queries/useReferenceDataQuery';
import { usePatientAdditionalDataQuery } from '../../../api/queries/usePatientAdditionalDataQuery';
import { Colors } from '../../../constants';
import { ForbiddenErrorModalContents } from '../../ForbiddenErrorModal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { TranslatedText } from '../../Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';
import { useEncounter } from '../../../contexts/Encounter';
import { useSettings } from '../../../contexts/Settings';
import { isZeroedBedFeeItem } from '../../../utils/invoice';

export const InvoiceRecordModal = ({ open, onClose, invoice }) => {
  const { getTranslation, translations } = useTranslation();
  const clinicianText = getTranslation(
    'general.localisedField.clinician.label.short',
    'Clinician',
    { casing: 'lower' },
  );

  const certificateQuery = useCertificate({
    footerAssetName: ASSET_NAMES.INVOICE_FOOTER,
  });
  const { getSetting } = useSettings();
  const { primaryTimeZone } = useDateTime();
  const enablePatientInsurer = getSetting('features.enablePatientInsurer');
  // spec: INVPRT#print-layout-setting
  const isReceiptLayout = getSetting('invoicing.printLayout') === INVOICE_PRINT_LAYOUTS.RECEIPT;
  const { data: certificateData } = certificateQuery;

  const { encounter } = useEncounter();

  // In-progress invoices can be printed, so drop bed-fee lines zeroed by a ward move — they carry
  // no charge and are cleaned off at finalisation anyway.
  const printableInvoice = {
    ...invoice,
    items: invoice.items?.filter(item => !isZeroedBedFeeItem(item)),
  };

  const patientQuery = usePatientDataQuery(invoice.encounter.patientId);
  const patient = patientQuery.data;

  // Only the A4 layout prints the patient's additional data and village, so the receipt doesn't
  // fetch them and isn't held up waiting on them
  const padDataQuery = usePatientAdditionalDataQuery(isReceiptLayout ? null : patient?.id);
  const { data: additionalData } = padDataQuery;

  const villageQuery = useReferenceDataQuery(isReceiptLayout ? null : patient?.villageId);
  const village = villageQuery.data;

  const allQueries = combineQueries([patientQuery, certificateQuery, villageQuery, padDataQuery]);

  // What both layouts need, so neither can drop a prop the other is given
  const printoutProps = {
    certificateData,
    getSetting,
    invoice: printableInvoice,
    translations,
    primaryTimeZone,
  };

  const modalProps = {
    title: (
      <TranslatedText
        stringId="invoice.modal.print.invoiceRecord.title"
        fallback="Print Invoice"
        data-testid="translatedtext-hj8p"
      />
    ),
    color: Colors.white,
    open,
    onClose,
    // The preview fills the modal's width, so a narrow receipt needs a narrow modal to stay legible
    maxWidth: isReceiptLayout ? 'xs' : 'md',
    printable: !allQueries.isError && !allQueries.isFetching, // do not show print button when there is error or is fetching
  };

  if (allQueries.isError) {
    if (allQueries.errors.some(e => e instanceof ForbiddenError)) {
      return (
        <Modal {...modalProps} data-testid="modal-ncf9">
          <ForbiddenErrorModalContents
            onClose={onClose}
            data-testid="forbiddenerrormodalcontents-a5z6"
          />
        </Modal>
      );
    }
  }

  return (
    <Modal {...modalProps} onPrint={() => printPDF('invoice-record')} data-testid="modal-gylm">
      <PDFLoader isLoading={allQueries.isFetching} id="invoice-record" data-testid="pdfloader-yikw">
        {isReceiptLayout ? (
          <InvoiceReceiptPrintout
            {...printoutProps}
            // A failed patient fetch still renders the preview, without a print button, so give
            // the receipt an empty patient as the A4 effectively gets
            patientData={patient ?? {}}
            data-testid="invoicereceiptprintout-k4vd"
          />
        ) : (
          <InvoiceRecordPrintout
            {...printoutProps}
            patientData={{ ...patient, additionalData, village }}
            encounter={encounter}
            clinicianText={clinicianText}
            enablePatientInsurer={enablePatientInsurer}
            data-testid="invoicerecordprintout-0r2o"
          />
        )}
      </PDFLoader>
    </Modal>
  );
};
