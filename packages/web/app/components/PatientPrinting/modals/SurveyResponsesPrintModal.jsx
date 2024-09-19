import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';

import { Modal, TranslatedText } from '../..';
import { Colors } from '../../../constants';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useLocalisation } from '../../../contexts/Localisation';
import { useTranslation } from '../../../contexts/Translation';
import { SurveyResponsesPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useSurveyResponse } from '../../../api/queries/useSurveyResponse';

export const SurveyResponsesPrintModal = React.memo(
  ({ patient, open, onClose, surveyResponse }) => {
    const { getLocalisation } = useLocalisation();
    const { getTranslation } = useTranslation();
    const api = useApi();
    const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

    const {
      data: additionalData,
      isLoading: isAdditionalDataLoading,
    } = usePatientAdditionalDataQuery(patient.id);

    const { data: village = {}, isLoading: isVillageQueryLoading } = useQuery(
      ['village', patient.id],
      () => api.get(`referenceData/${encodeURIComponent(patient.villageId)}`),
      {
        enabled: !!patient?.villageId,
      },
    );

    const { data: surveyResponseData, isLoading: surveyResponseLoading } = useSurveyResponse(
      surveyResponse?.id,
    );

    const { data: user, isLoading: isUserLoading } = useQuery(
      ['user', surveyResponseData?.userId],
      () => api.get(`user/${surveyResponseData?.userId}`),
      {
        enabled: !!surveyResponseData?.userId,
      },
    );

    const isLoading =
      isAdditionalDataLoading ||
      isCertificateFetching ||
      isVillageQueryLoading ||
      surveyResponseLoading ||
      isUserLoading;

    return (
      <Modal
        title={
          <TranslatedText stringId="surveyResponse.modal.details.title" fallback="Form response" />
        }
        open={open}
        onClose={onClose}
        width="md"
        color={Colors.white}
        printable
        onPrint={() => printPDF('survey-responses-printout')}
      >
        <PDFLoader isLoading={isLoading} id="survey-responses-printout">
          <SurveyResponsesPrintout
            patientData={{ ...patient, additionalData, village }}
            surveyResponse={{
              ...surveyResponseData,
              user,
              programName: surveyResponse?.programName,
            }}
            certificateData={certificateData}
            getLocalisation={getLocalisation}
            getTranslation={getTranslation}
          />
        </PDFLoader>
      </Modal>
    );
  },
);
