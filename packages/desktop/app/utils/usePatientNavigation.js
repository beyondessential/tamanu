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
        modal,
        ...params,
      }),
    );

  const navigateToEncounter = (encounterId, modal) =>
    navigate(
      generatePath('/patients/:category/:patientId/encounter/:encounterId/:modal?', {
        encounterId,
        modal,
        ...params,
      }),
    );

  const navigateToLabRequest = (labRequestId, modal) =>
    navigate(
      generatePath(
        '/patients/:category/:patientId/encounter/:encounterId/lab-request/:labRequestId/:modal?',
        {
          labRequestId,
          modal,
          ...params,
        },
      ),
    );

  const navigateToImagingRequest = (imagingRequestId, modal) =>
    navigate(
      generatePath(
        '/patients/:category/:patientId/encounter/:encounterId/lab-request/:imagingRequestId/:modal?',
        {
          imagingRequestId,
          modal,
          ...params,
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
