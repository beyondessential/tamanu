import { generatePath, useParams } from 'react-router-dom';

export const usePatientLink = () => {
  const params = useParams();

  const getPatientLink = (patientId, modal) =>
    generatePath('/patients/:category/:patientId/:modal?', {
      patientId,
      modal,
      ...params,
    });

  const getEncounterLink = (encounterId, modal) =>
    generatePath('/patients/:category/:patientId/encounter/:encounterId/:modal?', {
      encounterId,
      modal,
      ...params,
    });

  const getLabRequestLink = (labRequestId, modal) =>
    generatePath(
      '/patients/:category/:patientId/encounter/:encounterId/lab-request/:labRequestId/:modal?',
      {
        labRequestId,
        modal,
        ...params,
      },
    );

  const getImagingRequestLink = (imagingRequestId, modal) =>
    generatePath(
      '/patients/:category/:patientId/encounter/:encounterId/lab-request/:imagingRequestId/:modal?',
      {
        imagingRequestId,
        modal,
        ...params,
      },
    );

  return {
    getPatientLink,
    getEncounterLink,
    getLabRequestLink,
    getImagingRequestLink,
  };
};
