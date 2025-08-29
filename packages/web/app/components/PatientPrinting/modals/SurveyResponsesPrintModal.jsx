import React, { useEffect, useState } from 'react';
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
import { cloneDeep } from 'lodash';
import { PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { getPatientDataDisplayValue } from '../../../utils/survey';

export const SurveyResponsesPrintModal = React.memo(
  ({ patient, open, onClose, surveyResponseId, title, isReferral, submittedBy }) => {
    const { getLocalisation } = useLocalisation();
    const { getTranslation, getEnumTranslation, getReferenceDataTranslation } = useTranslation();
    const { getSetting } = useSettings();
    const api = useApi();
    const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();

    const [transformedSurveyResponse, setTransformedSurveyResponse] = useState(null);
    const [isTransforming, setIsTransforming] = useState(false);

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

    useEffect(() => {
      if (surveyResponse) {
        handleTransformSurveyResponse(surveyResponse);
      }
    }, [surveyResponse]);

    const handleTransformSurveyResponse = async surveyResponse => {
      setIsTransforming(true);
      const transformedSurveyResponse = cloneDeep(surveyResponse);
      const answers = transformedSurveyResponse.answers;

      const patientDataPromises = transformedSurveyResponse.answers
        .filter(answer => {
          const component = surveyResponse.components.find(
            component => component.dataElementId === answer.dataElementId,
          );
          return (
            component &&
            (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA ||
              (component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER &&
                answer.sourceType === PROGRAM_DATA_ELEMENT_TYPES.PATIENT_DATA))
          );
        })
        .map(async answer => {
          const component = surveyResponse.components.find(
            component => component.dataElementId === answer.dataElementId,
          );

          const originalConfig = component.config;
          const sourceConfig = answer.sourceConfig;
          const config =
            component.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.SURVEY_ANSWER
              ? sourceConfig
              : originalConfig;

          const displayValue = await getPatientDataDisplayValue({
            api,
            getEnumTranslation,
            getReferenceDataTranslation,
            value: answer.originalBody,
            config: config ? JSON.parse(config) : {},
          });
          return {
            dataElementId: answer.dataElementId,
            displayValue,
          };
        });

      const patientDataResults = await Promise.all(patientDataPromises);

      patientDataResults.forEach(({ dataElementId, displayValue }) => {
        const currentAnswer = answers.find(a => a.dataElementId === dataElementId);
        if (currentAnswer) {
          currentAnswer.body = displayValue;
        }
      });

      setTransformedSurveyResponse(transformedSurveyResponse);
      setIsTransforming(false);
    };

    const isLoading =
      isAdditionalDataLoading ||
      isCertificateFetching ||
      (isVillageQueryLoading && patient?.villageId) ||
      surveyResponseLoading ||
      (isUserLoading && surveyResponse?.userId) ||
      (isFacilityLoading && facilityId) ||
      isTransforming;

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
            getLocalisation={getLocalisation}
            getTranslation={getTranslation}
            getSetting={getSetting}
            isReferral={isReferral}
            currentUser={currentUser}
            facility={facility}
            data-testid="surveyresponsesprintout-7nfz"
          />
        </PDFLoader>
      </Modal>
    );
  },
);
