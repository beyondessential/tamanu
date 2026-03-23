import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { Button, Modal, TranslatedText, useDateTime } from '@tamanu/ui-components';
import { useCertificate } from '../../../utils/useCertificate';
import { PDFLoader, printPDF } from '../PDFLoader';
import { DeathCertificatePrintout } from '@tamanu/shared/utils/patientCertificates';
import { usePatientAdditionalDataQuery, useReferenceDataQuery } from '../../../api/queries';
import { useTranslation } from '../../../contexts/Translation';
import { useSettings } from '../../../contexts/Settings';
import { Colors } from '../../../constants/styles';
import { useAuth } from '../../../contexts/Auth';

const useParentQuery = (enabled, parentId) => {
  const api = useApi();
  return useQuery(
    ['parentData', parentId],
    async () => (parentId ? api.get(`patient/${encodeURIComponent(parentId)}`) : null),
    { enabled },
  );
};

const StyledButton = styled(Button)`
  &&.MuiButton-containedPrimary.Mui-disabled {
    background-color: ${Colors.softText};
  }
`;

export const DeathCertificateModal = ({ patient, deathData }) => {
  const [isOpen, setIsOpen] = useState();
  const { storedLanguage, translations } = useTranslation();
  const { getSetting } = useSettings();
  const { currentUser } = useAuth();
  const { primaryTimeZone } = useDateTime();

  const {
    data: additionalData,
    isFetching: isAdditionalDataFetching,
  } = usePatientAdditionalDataQuery(patient.id);
  const { data: motherData, isLoading: isMotherDataLoading } = useParentQuery(
    !!additionalData,
    additionalData?.motherId,
  );
  const { data: fatherData, isLoading: isFatherDataLoading } = useParentQuery(
    !!additionalData,
    additionalData?.fatherId,
  );
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();
  const { data: village, isLoading: isVillageLoading } = useReferenceDataQuery(patient?.villageId);

  const patientData = {
    ...patient,
    ...deathData,
    additionalData,
    motherData,
    fatherData,
    village,
  };

  const isLoading = isAdditionalDataFetching
    || isCertificateFetching
    || isMotherDataLoading
    || isFatherDataLoading
    || isVillageLoading;

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
            getSetting={getSetting}
            language={storedLanguage}
            translations={translations}
            printedBy={currentUser?.displayName}
            primaryTimeZone={primaryTimeZone}
            data-testid="deathcertificateprintout-l7w8"
          />
        </PDFLoader>
      </Modal>
      <StyledButton
        variant="contained"
        color="primary"
        onClick={() => setIsOpen(true)}
        disabled={!deathData.isFinal}
        data-testid="button-9v7x"
      >
        {deathData.isFinal ? (
          <TranslatedText
            stringId="death.action.viewDeathCertificate"
            fallback="View death certificate"
            data-testid="translatedtext-gawt"
          />
        ) : (
          <TranslatedText
            stringId="death.action.deathCertificatePending"
            fallback="Death certificate pending"
            data-testid="translatedtext-twag"
          />
        )}
      </StyledButton>
    </>
  );
};
