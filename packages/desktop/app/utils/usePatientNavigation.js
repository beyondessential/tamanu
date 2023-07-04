import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { generatePath, matchPath, useLocation } from 'react-router-dom';
import { PATIENT_PATHS } from '../constants/patientPaths';

export const usePatientNavigation = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const navigate = url => dispatch(push(url));

  const getParams = path =>
    matchPath(location.pathname, {
      path,
      exact: false,
      strict: false,
    })?.params;

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

  const navigateToEncounter = (encounterId, modal, search) => {
    const existingParams = getParams(PATIENT_PATHS.PATIENT);
    const encounterRoute = generatePath(`${PATIENT_PATHS.ENCOUNTER}/:modal?`, {
      ...existingParams,
      encounterId,
      modal,
    });
    navigate(`${encounterRoute}${search ? `?${new URLSearchParams(search)}` : ''}`);
  };

  const navigateToSummary = () => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(
      generatePath(`${PATIENT_PATHS.ENCOUNTER}/summary/view`, {
        ...existingParams,
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

  return {
    navigateToPatient,
    navigateToEncounter,
    navigateToLabRequest,
    navigateToImagingRequest,
    navigateToCategory,
    navigateToSummary,
  };
};
