import React, { useState } from 'react';
import { Button, Modal, TranslatedText } from '@tamanu/ui-components';
import { useCertificate } from '../../../utils/useCertificate';
import { PDFLoader, printPDF } from '../PDFLoader';
import { DeathCertificatePrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { usePatientAdditionalDataQuery, useReferenceDataQuery } from '../../../api/queries';
import { useTranslation } from '../../../contexts/Translation';
import { useSettings } from '../../../contexts/Settings';

export const DeathCertificateModal = ({ patient, deathData }) => {
  const [isOpen, setIsOpen] = useState();
  const { getLocalisation } = useLocalisation();
  const { storedLanguage, translations } = useTranslation();
  const { getSetting } = useSettings();

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
            data-testid="translatedtext-q14d"
          />
        }
        open={isOpen}
        onClose={() => setIsOpen(false)}
        width="md"
        printable
        onPrint={() => printPDF('death-certificate-printout')}
        data-testid="modal-zmo8"
      >
        <PDFLoader
          isLoading={isLoading}
          id="death-certificate-printout"
          data-testid="pdfloader-cas2"
        >
          <DeathCertificatePrintout
            patientData={patientData}
            certificateData={certificateData}
            getLocalisation={getLocalisation}
            getSetting={getSetting}
            language={storedLanguage}
            translations={translations}
            data-testid="deathcertificateprintout-l7w8"
          />
        </PDFLoader>
      </Modal>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setIsOpen(true)}
        data-testid="button-9v7x"
      >
        <TranslatedText
          stringId="death.action.viewDeathCertificate"
          fallback="View death certificate"
          data-testid="translatedtext-gawt"
        />
      </Button>
    </>
  );
};
