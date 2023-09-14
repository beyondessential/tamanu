import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Modal } from '../../Modal';
import { useAuth } from '../../../contexts/Auth';
import { useApi, isErrorUnknownAllow404s } from '../../../api';
import { LoadingIndicator } from '../../LoadingIndicator';
import { useCertificate } from '../../../utils/useCertificate';
import { usePatientAdditionalDataQuery } from '../../../api/queries';

import { BirthNotificationCertificate } from '../printouts/BirthNotificationCertificate';

const useParent = (api, enabled, parentId) => {
  const { data: parentData, isLoading: parentDataIsLoading } = useQuery(
    ['parentData', parentId],
    async () => (parentId ? api.get(`patient/${encodeURIComponent(parentId)}`) : null),
    { enabled },
  );

  const { data: additionalData, isLoading: additionalDataLoading } = useQuery(
    ['additionalData', parentId],
    () => api.get(`patient/${encodeURIComponent(parentId)}/additionalData`),
    { enabled },
  );

  const { data: village, isLoading: villageLoading } = useQuery(
    ['village', parentData?.villageId],
    () =>
      parentData?.villageId
        ? api.get(`referenceData/${encodeURIComponent(parentData.villageId)}`)
        : null,
    { enabled: !parentDataIsLoading },
  );

  const { data: occupation, isLoading: occupationLoading } = useQuery(
    ['occupation', additionalData?.occupationId],
    () =>
      additionalData?.occupationId
        ? api.get(`referenceData/${encodeURIComponent(additionalData.occupationId)}`)
        : null,
    { enabled: !additionalDataLoading },
  );

  const { data: ethnicity, isLoading: ethnicityLoading } = useQuery(
    ['ethnicity', additionalData?.ethnicityId],
    () =>
      additionalData?.ethnicityId
        ? api.get(`referenceData/${encodeURIComponent(additionalData.ethnicityId)}`)
        : null,
    { enabled: !additionalDataLoading },
  );

  const { data: grandMother, isLoading: grandMotherLoading } = useQuery(
    ['mothersName', additionalData?.motherId],
    () =>
      additionalData?.motherId
        ? api.get(`patient/${encodeURIComponent(additionalData?.motherId)}`)
        : null,
    { enabled: !additionalDataLoading },
  );

  const { data: grandFather, isLoading: grandFatherLoading } = useQuery(
    ['fathersName', additionalData?.fatherId],
    () =>
      additionalData?.fatherId
        ? api.get(`patient/${encodeURIComponent(additionalData?.fatherId)}`)
        : null,
    { enabled: !additionalDataLoading },
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
      parentDataIsLoading ||
      additionalDataLoading ||
      grandMotherLoading ||
      grandFatherLoading ||
      villageLoading ||
      occupationLoading ||
      ethnicityLoading,
  };
};

export const BirthNotificationCertificateModal = React.memo(({ patient }) => {
  const [open, setOpen] = useState(true);
  const api = useApi();
  const { facility } = useAuth();
  const certificateData = useCertificate();
  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );
  const { data: motherData, isLoading: motherDataLoading } = useParent(
    api,
    !!additionalData,
    additionalData?.motherId,
  );
  const { data: fatherData, isLoading: fatherDataLoading } = useParent(
    api,
    !!additionalData,
    additionalData?.fatherId,
  );

  const { data: birthData, isLoading: birthDataLoading } = useQuery(['birthData', patient.id], () =>
    api.get(`patient/${encodeURIComponent(patient.id)}/birthData`),
  );

  const { data: deathData, isLoading: deathDataLoading } = useQuery(['deathData', patient.id], () =>
    api.get(
      `patient/${encodeURIComponent(patient.id)}/death`,
      {},
      { isErrorUnknown: isErrorUnknownAllow404s },
    ),
  );

  const { data: ethnicity, isLoading: ethnicityLoading } = useQuery(
    ['ethnicity', additionalData?.ethnicityId],
    () =>
      additionalData?.ethnicityId
        ? api.get(`referenceData/${encodeURIComponent(additionalData.ethnicityId)}`)
        : null,
    { enabled: !additionalDataLoading },
  );

  const loading =
    motherDataLoading ||
    fatherDataLoading ||
    birthDataLoading ||
    ethnicityLoading ||
    deathDataLoading;

  return (
    <Modal open={open} onClose={() => setOpen(false)} width="md" printable keepMounted>
      {loading ? (
        <LoadingIndicator />
      ) : (
        <BirthNotificationCertificate
          motherData={motherData}
          fatherData={fatherData}
          childData={{ ...patient, birthData, additionalData, ethnicity, deathData }}
          facility={facility}
          certificateData={certificateData}
        />
      )}
    </Modal>
  );
});
