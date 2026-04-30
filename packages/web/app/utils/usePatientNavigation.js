import { useCallback } from 'react';
import { generatePath, matchPath, useLocation, useNavigate, useParams } from 'react-router';
import { PATIENT_CATEGORIES, PATIENT_PATHS } from '../constants/patientPaths';

export const usePatientNavigation = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const getParams = useCallback(
    path => matchPath({ path, end: false }, location.pathname)?.params ?? {},
    [location.pathname],
  );

  const navigateToCategory = useCallback(
    category => void navigate(generatePath(PATIENT_PATHS.CATEGORY, { category })),
    [navigate],
  );

  const navigateToPatient = useCallback(
    (patientId, search, options) => {
      const routeParams = getParams(PATIENT_PATHS.CATEGORY);
      const { category = PATIENT_CATEGORIES.ALL } = routeParams;
      const patientRoute = generatePath(PATIENT_PATHS.PATIENT, { category, patientId });
      navigate(
        {
          pathname: patientRoute,
          ...(search && { search: `?${new URLSearchParams(search)}` }),
        },
        options,
      );
    },
    [navigate, getParams],
  );

  const navigateToEncounter = useCallback(
    (encounterId, search, replaceInHistory = false) => {
      const existingParams = getParams(PATIENT_PATHS.PATIENT);
      const encounterRoute = generatePath(PATIENT_PATHS.ENCOUNTER, {
        ...existingParams,
        encounterId,
      });
      navigate(
        {
          pathname: encounterRoute,
          ...(search && { search: `?${new URLSearchParams(search)}` }),
        },
        { replace: Boolean(replaceInHistory) },
      );
    },
    [navigate, getParams],
  );

  const navigateToSummary = useCallback(() => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(
      generatePath(`${PATIENT_PATHS.ENCOUNTER}/summary/view`, {
        ...existingParams,
      }),
    );
  }, [navigate, getParams]);

  const navigateToMar = useCallback(() => {
    const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
    navigate(generatePath(`${PATIENT_PATHS.ENCOUNTER}/mar/view`, existingParams));
  }, [navigate, getParams]);

  // @todo: refactor modal that is used in imaging request printing
  const navigateToImagingRequest = useCallback(
    (imagingRequestId, modal) => {
      const existingParams = getParams(PATIENT_PATHS.ENCOUNTER);
      navigate(
        generatePath(`${PATIENT_PATHS.IMAGING_REQUEST}/:modal?`, {
          ...existingParams,
          imagingRequestId,
          modal,
        }),
      );
    },
    [navigate, getParams],
  );

  const navigateToProgramRegistry = useCallback(
    programRegistryId => {
      if (programRegistryId) {
        const programRegistryRoute = generatePath(PATIENT_PATHS.PROGRAM_REGISTRY, {
          ...params,
          programRegistryId,
        });
        navigate(programRegistryRoute);
      } else {
        const existingParams = getParams(PATIENT_PATHS.PROGRAM_REGISTRY);
        navigate({
          pathname: generatePath(PATIENT_PATHS.PROGRAM_REGISTRY, existingParams),
          search: location.search,
        });
      }
    },
    [navigate, params, getParams, location.search],
  );

  const navigateToProgramRegistrySurvey = useCallback(
    (programRegistryId, surveyId) => {
      const programRegistryRoute = generatePath(PATIENT_PATHS.PROGRAM_REGISTRY_SURVEY, {
        ...params,
        programRegistryId,
        surveyId,
      });
      navigate(programRegistryRoute);
    },
    [navigate, params],
  );

  const setNavigateBackTab = useCallback(
    tab => window.history.replaceState(null, '', `${location.pathname}?tab=${tab}`),
    [location.pathname],
  );

  return {
    navigateToPatient,
    navigateToEncounter,
    navigateToImagingRequest,
    navigateToCategory,
    navigateToSummary,
    navigateToMar,
    navigateToProgramRegistry,
    navigateToProgramRegistrySurvey,
    setNavigateBackTab,
  };
};
