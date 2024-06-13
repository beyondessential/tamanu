import React, { useState } from 'react';
import { Modal } from '../../Modal';
import { Button } from '../../Button';
import { useCertificate } from '../../../utils/useCertificate';
import { PDFLoader, printPDF } from '../PDFLoader';
import { DeathCertificatePrintout } from '@tamanu/shared/utils/patientCertificates';
import { useLocalisation } from '../../../contexts/Localisation';
import { useEthnicityQuery, usePatientAdditionalDataQuery } from '../../../api/queries';

export const DeathCertificateModal = ({ patient, deathData }) => {
  const [isOpen, setIsOpen] = useState();
  const { getLocalisation } = useLocalisation();

  const {
    data: additionalData,
    isFetching: isAdditionalDataFetching,
  } = usePatientAdditionalDataQuery(patient.id);

  const { data: ethnicity, isLoading: isEthnicityFetching } = useEthnicityQuery(
    additionalData?.ethnicityId,
    !isAdditionalDataFetching,
  );

  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

  const patientData = { ...patient, ...deathData, additionalData, ethnicity };

  const isLoading = isAdditionalDataFetching || isCertificateFetching || isEthnicityFetching;

  return (
    <>
      <Modal
        title="Cause of death certificate"
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
          />
        </PDFLoader>
      </Modal>
      <Button variant="contained" color="primary" onClick={() => setIsOpen(true)}>
        View death certificate
      </Button>
    </>
  );
};
