import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { generatePath, useParams } from 'react-router-dom';

export const usePatientNavigation = () => {
  const params = useParams();
  const dispatch = useDispatch();

  const navigate = url => dispatch(push(url));

  const navigateToPatient = (patientId, modal) =>
    navigate(
      generatePath('/patients/:category/:patientId/:modal?', {
        patientId,
        ...params,
        modal,
      }),
    );

  const navigateToEncounter = (encounterId, modal) =>
    navigate(
      generatePath('/patients/:category/:patientId/encounter/:encounterId/:modal?', {
        encounterId,
        ...params,
        modal,
      }),
    );

  const navigateToLabRequest = (labRequestId, modal) =>
    navigate(
      generatePath(
        '/patients/:category/:patientId/encounter/:encounterId/lab-request/:labRequestId/:modal?',
        {
          labRequestId,
          ...params,
          modal,
        },
      ),
    );

  const navigateToImagingRequest = (imagingRequestId, modal) =>
    navigate(
      generatePath(
        '/patients/:category/:patientId/encounter/:encounterId/lab-request/:imagingRequestId/:modal?',
        {
          imagingRequestId,
          ...params,
          modal,
        },
      ),
    );

  return {
    navigateToPatient,
    navigateToEncounter,
    navigateToLabRequest,
    navigateToImagingRequest,
  };
};
