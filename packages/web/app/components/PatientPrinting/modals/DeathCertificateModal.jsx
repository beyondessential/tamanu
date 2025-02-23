import React, { useState } from 'react';
import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { useCertificate } from '../../../utils/useCertificate';
import { PDFLoader, printPDF } from '../PDFLoader';
import { DeathCertificatePrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientAdditionalDataQuery, useReferenceDataQuery } from '../../../api/queries';
import { useTranslation } from '../../../contexts/Translation';
import { TranslatedText } from '../../Translation';

export const DeathCertificateModal = ({ patient, deathData }) => {
  const [isOpen, setIsOpen] = useState();
  const { getLocalisation } = useLocalisation();
  const { storedLanguage, translations } = useTranslation();

  const {
    data: additionalData,
    isFetching: isAdditionalDataFetching,
  } = usePatientAdditionalDataQuery(patient.id);

  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

  const villageQuery = useReferenceDataQuery(patient?.villageId);
  const village = villageQuery.data;

  const patientData = { ...patient, ...deathData, additionalData, village };

  const isLoading = isAdditionalDataFetching || isCertificateFetching;

  return (
    <>
      <Modal
        title={
          <TranslatedText
            stringId="death.modal.deathCertificate.title"
            fallback="Cause of death certificate"
          />
        }
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="md"
        printable
        onPrint={() => printPDF('death-certificate-printout')}
      >
        <PDFLoader isLoading={isLoading} id="death-certificate-printout">
          <DeathCertificatePrintout
            patientData={patientData}
            certificateData={certificateData}
            getLocalisation={getLocalisation}
            language={storedLanguage}
            translations={translations}
          />
        </PDFLoader>
      </Modal>
      <Button variant="contained" color="primary" onClick={() => setIsOpen(true)}>
        <TranslatedText
          stringId="death.action.viewDeathCertificate"
          fallback="View death certificate"
        />
      </Button>
    </>
  );
};
