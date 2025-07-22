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
import { useSurveyResponseQuery } from '../../../api/queries/useSurveyResponseQuery';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';

export const SurveyResponsesPrintModal = React.memo(
  ({ patient, open, onClose, surveyResponseId, title, isReferral, submittedBy }) => {
    const { getLocalisation } = useLocalisation();
    const { getTranslation } = useTranslation();
    const { getSetting } = useSettings();
    const api = useApi();
    const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

    const { facilityId, currentUser } = useAuth();
    const { data: facility, isLoading: isFacilityLoading } = useQuery(
      ['facility', facilityId],
      async () => await api.get(`facility/${encodeURIComponent(facilityId)}`),
      {
        enabled: !!facilityId,
      },
    );

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

    const { data: surveyResponse, isLoading: surveyResponseLoading } = useSurveyResponseQuery(
      surveyResponseId,
    );

    const { data: user, isLoading: isUserLoading } = useQuery(
      ['user', surveyResponse?.userId],
      () => api.get(`user/${surveyResponse?.userId}`),
      {
        enabled: !!surveyResponse?.userId,
      },
    );

    const isLoading =
      isAdditionalDataLoading ||
      isCertificateFetching ||
      (isVillageQueryLoading && patient?.villageId) ||
      surveyResponseLoading ||
      (isUserLoading && surveyResponse?.userId) ||
      (isFacilityLoading && facilityId);

    return (
      <Modal
        title={
          <TranslatedText
            stringId="surveyResponse.modal.details.title"
            fallback="Form response"
            data-testid="translatedtext-wxg3"
          />
        }
        open={open}
        onClose={onClose}
        width="md"
        color={Colors.white}
        printable
        onPrint={() => printPDF('survey-responses-printout')}
        data-testid="modal-65lj"
      >
        <PDFLoader
          isLoading={isLoading}
          id="survey-responses-printout"
          data-testid="pdfloader-8yz5"
        >
          <SurveyResponsesPrintout
            patientData={{ ...patient, additionalData, village }}
            surveyResponse={{
              ...surveyResponse,
              title,
              submittedBy: submittedBy || user?.displayName,
            }}
            certificateData={certificateData}
            getLocalisation={getLocalisation}
            getTranslation={getTranslation}
            isReferral={isReferral}
            currentUser={currentUser}
            facility={facility}
            getSetting={getSetting}
            data-testid="surveyresponsesprintout-7nfz"
          />
        </PDFLoader>
      </Modal>
    );
  },
);
