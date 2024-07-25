import React from 'react';

import { ForbiddenError } from '@tamanu/shared/errors';

import { InvoiceRecordPrintout } from '@tamanu/shared/utils/patientCertificates';
import { Modal } from '../../Modal';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientData } from '../../../api/queries/usePatientData';
import { combineQueries } from '../../../api/combineQueries';
import { useReferenceData } from '../../../api/queries/useReferenceData';
import { usePatientAdditionalDataQuery } from '../../../api/queries/usePatientAdditionalDataQuery';
import { useLocalisation } from '../../../contexts/Localisation';
import { Colors } from '../../../constants';
import { ForbiddenErrorModalContents } from '../../ForbiddenErrorModal';
import { PDFLoader, printPDF } from '../PDFLoader';
import { TranslatedText } from '../../Translation/TranslatedText';
import { useTranslation } from '../../../contexts/Translation';
import { useEncounterData } from '../../../api/queries';

export const InvoiceRecordModal = ({ 
  open, 
  onClose, 
  invoice,
}) => {
  const { getTranslation } = useTranslation();
  const clinicianText = getTranslation(
    'general.localisedField.clinician.label.short',
    'Clinician',
  ).toLowerCase();

  const { getLocalisation } = useLocalisation();
  const certificateQuery = useCertificate();
  const { data: certificateData } = certificateQuery;

  const encounterQuery = useEncounterData(invoice.encounter.id);
  const { data: encounter } = encounterQuery;

  const patientQuery = usePatientData(invoice.encounter.patientId);
  const patient = patientQuery.data;

  const padDataQuery = usePatientAdditionalDataQuery(patient?.id);
  const { data: additionalData } = padDataQuery;

  const villageQuery = useReferenceData(patient?.villageId);
  const village = villageQuery.data;

  const allQueries = combineQueries([
    encounterQuery,
    patientQuery,
    certificateQuery,
    villageQuery,
    padDataQuery,
  ]);

  const modalProps = {
    title: (
      <TranslatedText
        stringId="invoice.modal.print.invoiceRecord.title"
        fallback="Invoice Record"
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
        <Modal {...modalProps}>
          <ForbiddenErrorModalContents onClose={onClose} />
        </Modal>
      );
    }
  }


  return (
    <Modal {...modalProps} onPrint={() => printPDF('invoice-record')}>
      <PDFLoader isLoading={allQueries.isFetching} id="invoice-record">
        <InvoiceRecordPrintout
          patientData={{ ...patient, additionalData, village }}
          encounter={encounter}
          certificateData={certificateData}
          getLocalisation={getLocalisation}
          clinicianText={clinicianText}
          invoice={invoice}
        />
      </PDFLoader>
    </Modal>
  );
};
