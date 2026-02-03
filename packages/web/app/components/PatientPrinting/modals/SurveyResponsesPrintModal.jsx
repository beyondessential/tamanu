import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { useApi } from '../../../api';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { useCertificate } from '../../../utils/useCertificate';

import { Modal, TranslatedText } from '../..';
import { Colors } from '../../../constants';
import { PDFLoader, printPDF } from '../PDFLoader';
import { useTranslation } from '../../../contexts/Translation';
import { SurveyResponsesPrintout } from '@tamanu/shared/utils/patientCertificates';
import { useTransformedSurveyResponseQuery } from '../../../api/queries/useSurveyResponseQuery';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';

export const SurveyResponsesPrintModal = React.memo(
  ({ patient, open, onClose, surveyResponseId, title, isReferral, submittedBy }) => {
    const { getTranslation } = useTranslation();
    const { getSetting } = useSettings();
    const api = useApi();
    const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

    const { facilityId, currentUser } = useAuth();
    const { countryTimeZone } = useDateTimeFormat();
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

    const { data: transformedSurveyResponse, isLoading: surveyResponseLoading } = useTransformedSurveyResponseQuery(
      surveyResponseId,
    );

    const { data: user, isLoading: isUserLoading } = useQuery(
      ['user', transformedSurveyResponse?.userId],
      () => api.get(`user/${transformedSurveyResponse?.userId}`),
      {
        enabled: !!transformedSurveyResponse?.userId,
      },
    );

    const isLoading =
      isAdditionalDataLoading ||
      isCertificateFetching ||
      (isVillageQueryLoading && patient?.villageId) ||
      surveyResponseLoading ||
      (isUserLoading && transformedSurveyResponse?.userId) ||
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
              ...transformedSurveyResponse,
              title,
              submittedBy: submittedBy || user?.displayName,
            }}
            certificateData={certificateData}
            getTranslation={getTranslation}
            getSetting={getSetting}
            isReferral={isReferral}
            currentUser={currentUser}
            facility={facility}
            countryTimeZone={countryTimeZone}
            data-testid="surveyresponsesprintout-7nfz"
          />
        </PDFLoader>
      </Modal>
    );
  },
);
