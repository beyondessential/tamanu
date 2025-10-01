import { push, replace } from 'redux-first-history';
import { useDispatch } from 'react-redux';
import { generatePath, matchPath, useLocation, useParams } from 'react-router-dom';
import { PATIENT_CATEGORIES, PATIENT_PATHS } from '../constants/patientPaths';

export const usePatientNavigation = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const location = useLocation();

  const navigate = url => dispatch(push(url));

  const getParams = (path) =>
    matchPath({ path, end: false }, location.pathname)?.params ?? {};

  const navigateToCategory = category => {
    navigate(
      generatePath(PATIENT_PATHS.CATEGORY, {
        category,
      }),
    );
  };

  const navigateToPatient = (patientId, search) => {
    const params = getParams(PATIENT_PATHS.CATEGORY);
    const { category = PATIENT_CATEGORIES.ALL } = params;
    const patientRoute = generatePath(PATIENT_PATHS.PATIENT, {
      category,
      patientId,
    });
    navigate(`${patientRoute}${search ? `?${new URLSearchParams(search)}` : ''}`);
  };

  const navigateToEncounter = (encounterId, search, replaceInHistory = false) => {
    const existingParams = getParams(PATIENT_PATHS.PATIENT);
    const encounterRoute = generatePath(PATIENT_PATHS.ENCOUNTER, {
      ...existingParams,
      encounterId,
    });
    if (replaceInHistory) {
      dispatch(replace(`${encounterRoute}${search ? `?${new URLSearchParams(search)}` : ''}`));
    } else {
      navigate(`${encounterRoute}${search ? `?${new URLSearchParams(search)}` : ''}`);
    }
  };

  const navigateToSummary = () => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(
      generatePath(`${PATIENT_PATHS.ENCOUNTER}/summary/view`, {
        ...existingParams,
      }),
    );
  };

  const navigateToMar = () => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(
      generatePath(`${PATIENT_PATHS.ENCOUNTER}/mar/view`, {
        ...existingParams,
      }),
    );
  };

  const navigateToLabRequest = (labRequestId, search) => {
    const labRequestRoute = generatePath(PATIENT_PATHS.LAB_REQUEST, {
      ...params,
      labRequestId,
    });
    navigate(`${labRequestRoute}${search ? `?${new URLSearchParams(search)}` : ''}`);
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

  const navigateToProgramRegistry = programRegistryId => {
    if (programRegistryId) {
      const programRegistryRoute = generatePath(PATIENT_PATHS.PROGRAM_REGISTRY, {
        ...params,
        programRegistryId,
      });
      navigate(programRegistryRoute);
    } else {
      const existingParams = getParams(PATIENT_PATHS.PROGRAM_REGISTRY);
      const path = `${generatePath(`${PATIENT_PATHS.PROGRAM_REGISTRY}`, { ...existingParams })}?${
        location.search
      }`;
      navigate(path);
    }
  };

  const navigateToProgramRegistrySurvey = (programRegistryId, surveyId) => {
    const programRegistryRoute = generatePath(PATIENT_PATHS.PROGRAM_REGISTRY_SURVEY, {
      ...params,
      programRegistryId,
      surveyId,
    });
    navigate(programRegistryRoute);
  };
  return {
    navigateToPatient,
    navigateToEncounter,
    navigateToLabRequest,
    navigateToImagingRequest,
    navigateToCategory,
    navigateToSummary,
    navigateToMar,
    navigateToProgramRegistry,
    navigateToProgramRegistrySurvey,
  };
};
