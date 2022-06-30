import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { generatePath, matchPath, useLocation } from 'react-router-dom';
import { PATIENT_PATHS } from '../constants/patientRouteMap';

export const usePatientNavigation = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const navigate = url => dispatch(push(url));

  const getParams = path => {
    const match = matchPath(location.pathname, {
      path,
      exact: false,
      strict: false,
    });
    return match?.params || {};
  };

  const navigateToCategory = category => {
    navigate(
      generatePath(PATIENT_PATHS.CATEGORY, {
        category,
      }),
    );
  };

  const navigateToPatient = (patientId, modal) => {
    const existingParams = getParams(PATIENT_PATHS.CATEGORY);
    navigate(
      generatePath(`${PATIENT_PATHS.PATIENT}/:modal?`, {
        ...existingParams,
        patientId,
        modal,
      }),
    );
  };

  const navigateToEncounter = (encounterId, modal) => {
    const existingParams = getParams(PATIENT_PATHS.PATIENT);
    navigate(
      generatePath(`${PATIENT_PATHS.ENCOUNTER}/:modal?`, {
        ...existingParams,
        encounterId,
        modal,
      }),
    );
  };

  const navigateToLabRequest = (labRequestId, modal) => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(
      generatePath(`${PATIENT_PATHS.LAB_REQUEST}/:modal?`, {
        ...existingParams,
        labRequestId,
        modal,
      }),
    );
  };

  const navigateToImagingRequest = (imagingRequestId, modal) => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(
      generatePath(`${PATIENT_PATHS.IMAGING_REQUEST}/:modal?`, {
        ...existingParams,
        imagingRequestId,
        modal,
      }),
    );
  };

  const navigateBack = () => {
    const params = getParams(PATIENT_PATHS.ENCOUNTER);
    if (params.imagingRequestId || params.labRequestId) {
      navigateToEncounter();
    } else if (params.encounterId) {
      navigateToPatient();
    } else {
      navigateToCategory();
    }
  };

  return {
    navigateToPatient,
    navigateToEncounter,
    navigateToLabRequest,
    navigateToImagingRequest,
    navigateToCategory,
    navigateBack,
  };
};
