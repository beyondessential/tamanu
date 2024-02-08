import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../Modal';
import { useAuth } from '../../../contexts/Auth';
import { isErrorUnknownAllow404s, useApi } from '../../../api';
import { LoadingIndicator } from '../../LoadingIndicator';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientAdditionalDataQuery } from '../../../api/queries';
import { useLocalisation } from '../../../contexts/Localisation';

import { BirthNotificationCertificate } from '@tamanu/shared/utils/patientCertificates';
import { PDFViewer, printPDF } from '../PDFViewer';

const useParent = (api, enabled, parentId) => {
  const { data: parentData, isLoading: isParentDataLoading } = useQuery(
    ['parentData', parentId],
    async () => (parentId ? api.get(`patient/${encodeURIComponent(parentId)}`) : null),
    { enabled },
  );

  const { data: additionalData, isLoading: isAdditionalDataLoading } = useQuery(
    ['additionalData', parentId],
    () => api.get(`patient/${encodeURIComponent(parentId)}/additionalData`),
    { enabled },
  );

  const { data: village, isLoading: isVillageLoading } = useQuery(
    ['village', parentData?.villageId],
    () =>
      parentData?.villageId
        ? api.get(`referenceData/${encodeURIComponent(parentData.villageId)}`)
        : null,
    { enabled: !isParentDataLoading },
  );

  const { data: occupation, isLoading: isOccupationLoading } = useQuery(
    ['occupation', additionalData?.occupationId],
    () =>
      additionalData?.occupationId
        ? api.get(`referenceData/${encodeURIComponent(additionalData.occupationId)}`)
        : null,
    { enabled: !isAdditionalDataLoading },
  );

  const { data: ethnicity, isLoading: isEthnicityLoading } = useQuery(
    ['ethnicity', additionalData?.ethnicityId],
    () =>
      additionalData?.ethnicityId
        ? api.get(`referenceData/${encodeURIComponent(additionalData.ethnicityId)}`)
        : null,
    { enabled: !isAdditionalDataLoading },
  );

  const { data: grandMother, isLoading: isGrandMotherLoading } = useQuery(
    ['mothersName', additionalData?.motherId],
    () =>
      additionalData?.motherId
        ? api.get(`patient/${encodeURIComponent(additionalData?.motherId)}`)
        : null,
    { enabled: !isAdditionalDataLoading },
  );

  const { data: grandFather, isLoading: isGrandFatherLoading } = useQuery(
    ['fathersName', additionalData?.fatherId],
    () =>
      additionalData?.fatherId
        ? api.get(`patient/${encodeURIComponent(additionalData?.fatherId)}`)
        : null,
    { enabled: !isAdditionalDataLoading },
  );

  return {
    data: {
      ...parentData,
      additionalData,
      village,
      occupation,
      ethnicity,
      mother: grandMother,
      father: grandFather,
    },
    isLoading:
      isParentDataLoading ||
      isAdditionalDataLoading ||
      isGrandMotherLoading ||
      isGrandFatherLoading ||
      isVillageLoading ||
      isOccupationLoading ||
      isEthnicityLoading,
  };
};

export const BirthNotificationCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const api = useApi();
  const { facility } = useAuth();
  const { getLocalisation } = useLocalisation();
  const { data: certificateData, isFetching: isCertificateFetching } = useCertificate();
  const {
    data: additionalData,
    isLoading: isAdditionalDataLoading,
  } = usePatientAdditionalDataQuery(patient.id);
  const { data: motherData, isLoading: isMotherDataLoading } = useParent(
    api,
    !!additionalData,
    additionalData?.motherId,
  );
  const { data: fatherData, isLoading: isFatherDataLoading } = useParent(
    api,
    !!additionalData,
    additionalData?.fatherId,
  );

  const { data: birthData, isLoading: isBirthDataLoading } = useQuery(
    ['birthData', patient.id],
    () => api.get(`patient/${encodeURIComponent(patient.id)}/birthData`),
  );

  const { data: deathData, isLoading: isDeathDataLoading } = useQuery(
    ['deathData', patient.id],
    () =>
      api.get(
        `patient/${encodeURIComponent(patient.id)}/death`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
  );

  const { data: ethnicity, isLoading: isEthnicityLoading } = useQuery(
    ['ethnicity', additionalData?.ethnicityId],
    () =>
      additionalData?.ethnicityId
        ? api.get(`referenceData/${encodeURIComponent(additionalData.ethnicityId)}`)
        : null,
    { enabled: !isAdditionalDataLoading },
  );

  const isLoading =
    isMotherDataLoading ||
    isFatherDataLoading ||
    isBirthDataLoading ||
    isEthnicityLoading ||
    isDeathDataLoading ||
    isCertificateFetching;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      width="md"
      printable
      keepMounted
      onPrint={() => printPDF('birth-notification')}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <PDFViewer id="birth-notification">
          <BirthNotificationCertificate
            motherData={motherData}
            fatherData={fatherData}
            childData={{ ...patient, birthData, additionalData, ethnicity, deathData }}
            facility={facility}
            certificateData={certificateData}
            getLocalisation={getLocalisation}
          />
        </PDFViewer>
      )}
    </Modal>
  );
});
