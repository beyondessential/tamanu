import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { generatePath, useParams } from 'react-router-dom';

export const usePatientLink = () => {
  const params = useParams();
  const dispatch = useDispatch();

  const pushPatientLink = (patientId, modal) =>
    dispatch(
      push(
        generatePath('/patients/:category/:patientId/:modal?', {
          patientId,
          modal,
          ...params,
        }),
      ),
    );

  const pushEncounterLink = (encounterId, modal) =>
    dispatch(
      push(
        generatePath('/patients/:category/:patientId/encounter/:encounterId/:modal?', {
          encounterId,
          modal,
          ...params,
        }),
      ),
    );

  const pushLabRequestLink = (labRequestId, modal) =>
    dispatch(
      push(
        generatePath(
          '/patients/:category/:patientId/encounter/:encounterId/lab-request/:labRequestId/:modal?',
          {
            labRequestId,
            modal,
            ...params,
          },
        ),
      ),
    );

  const pushImagingRequestLink = (imagingRequestId, modal) =>
    dispatch(
      push(
        generatePath(
          '/patients/:category/:patientId/encounter/:encounterId/lab-request/:imagingRequestId/:modal?',
          {
            imagingRequestId,
            modal,
            ...params,
          },
        ),
      ),
    );

  return {
    pushPatientLink,
    pushEncounterLink,
    pushLabRequestLink,
    pushImagingRequestLink,
  };
};
