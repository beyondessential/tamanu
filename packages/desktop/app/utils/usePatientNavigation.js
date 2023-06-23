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

  const navigateToPatient = (patientId, search) => {
    const existingParams = getParams(PATIENT_PATHS.CATEGORY);
    const patientRoute = generatePath(PATIENT_PATHS.PATIENT, {
      ...existingParams,
      patientId,
    });
    navigate(`${patientRoute}${search ? `?${new URLSearchParams(search)}` : ''}`);
  };

  const navigateToEncounter = (encounterId, search) => {
    const existingParams = getParams(PATIENT_PATHS.PATIENT);
    const encounterRoute = generatePath(PATIENT_PATHS.ENCOUNTER, {
      ...existingParams,
      encounterId,
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

  // @todo: refactor modal that is used in lab request printing
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

  // @todo: refactor modal that is used in imaging request printing
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
