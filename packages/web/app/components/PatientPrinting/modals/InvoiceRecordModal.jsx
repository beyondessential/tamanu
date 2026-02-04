import React from 'react';
import { ForbiddenError } from '@tamanu/errors';
import { InvoiceRecordPrintout } from '@tamanu/shared/utils/patientCertificates';
import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';
import { combineQueries } from '../../../api/combineQueries';
import { useReferenceDataQuery } from '../../../api/queries/useReferenceDataQuery';
import { usePatientAdditionalDataQuery } from '../../../api/queries/usePatientAdditionalDataQuery';
import { useLocalisation } from '../../../contexts/Localisation';
import { Colors } from '../../../constants';
import { ForbiddenErrorModalContents } from '../../ForbiddenErrorModal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { TranslatedText } from '../../Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';
import { useEncounter } from '../../../contexts/Encounter';
import { useSettings } from '../../../contexts/Settings';

export const InvoiceRecordModal = ({ open, onClose, invoice }) => {
  const { getTranslation } = useTranslation();
  const clinicianText = getTranslation(
    'general.localisedField.clinician.label.short',
    'Clinician',
    { casing: 'lower' },
  );

  const { getLocalisation } = useLocalisation();
  const certificateQuery = useCertificate();
  const { getSetting } = useSettings();
  const enablePatientInsurer = getSetting('features.enablePatientInsurer');
  const { data: certificateData } = certificateQuery;

  const { encounter } = useEncounter();

  const patientQuery = usePatientDataQuery(invoice.encounter.patientId);
  const patient = patientQuery.data;

  const padDataQuery = usePatientAdditionalDataQuery(patient?.id);
  const { data: additionalData } = padDataQuery;

  const villageQuery = useReferenceDataQuery(patient?.villageId);
  const village = villageQuery.data;

  const allQueries = combineQueries([patientQuery, certificateQuery, villageQuery, padDataQuery]);

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
    maxWidth: 'md',
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
        <InvoiceRecordPrintout
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          certificateData={certificateData}
          getLocalisation={getLocalisation}
          getSetting={getSetting}
          clinicianText={clinicianText}
          invoice={invoice}
          enablePatientInsurer={enablePatientInsurer}
          data-testid="invoicerecordprintout-0r2o"
        />
      </PDFLoader>
    </Modal>
  );
};
