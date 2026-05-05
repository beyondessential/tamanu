import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { getAnswersFromData, SelectInput, FormGrid, useDateTime } from '@tamanu/ui-components';
import { SURVEY_TYPES } from '@tamanu/constants';
import { reloadPatient } from '../../store/patient';
import { getCurrentUser } from '../../store/auth';
import { SurveyView } from './SurveyView';
import { SurveySelector } from './SurveySelector';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientListingView } from '..';
import { usePatientAdditionalDataQuery, useSurveyResponseQuery } from '../../api/queries';
import { ErrorMessage } from '../../components/ErrorMessage';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useEncounter } from '../../contexts/Encounter';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useApi } from '../../api';
import { isErrorUnknownAllow404s } from '../../api/index.js';
import { useProgramRegistryContext } from '../../contexts/ProgramRegistry';
import { useAuth } from '../../contexts/Auth';
import { TranslatedReferenceData } from '../../components';
import { ForbiddenError } from '@tamanu/errors';

const SurveyFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { getCurrentDateTime } = useDateTime();
  const params = useParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { encounter, loadEncounter } = useEncounter();
  const { navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const surveyResponseId = params.surveyResponseId;
  const [survey, setSurvey] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [surveys, setSurveys] = useState(null);
  const [programReadError, setProgramReadError] = useState(null);
  const { setProgramRegistryIdByProgramId } = useProgramRegistryContext();

  useEffect(() => {
    if (params.encounterId) {
      loadEncounter(params.encounterId);
    }
  }, [loadEncounter, params.encounterId]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('program');
        setPrograms(data);
      } catch (error) {
        if (error instanceof ForbiddenError || error?.status === 403) {
          setPrograms([]);
        } else {
          throw error;
        }
      } finally {
        setProgramsLoading(false);
      }
    })();
  }, [api]);

  const setSelectedSurvey = useCallback(
    async id => {
      const response = await api.get(`survey/${encodeURIComponent(id)}`);
      setSurvey(response);
      setStartTime(getCurrentDateTime());
    },
    [api, getCurrentDateTime],
  );

  const unsetSurvey = useCallback(() => {
    setSurvey(null);
  }, []);

  const clearProgram = useCallback(() => {
    setSelectedSurveyId(null);
    setSurveys(null);
  }, []);

  const selectProgram = useCallback(
    async event => {
      const programId = event.target.value;
      if (programId === selectedProgramId) {
        return;
      }
      setSelectedProgramId(programId);
      setProgramRegistryIdByProgramId(programId);
      setSelectedSurveyId(null);
      setProgramReadError(null);

      if (!programId) {
        clearProgram();
        return;
      }

      try {
        const { data } = await api.get(`program/${programId}/surveys`, {
          ...(patient?.id ? { patientId: patient.id } : {}),
        });
        const programSurveys = data.filter(s => s.surveyType === SURVEY_TYPES.PROGRAMS);
        setSurveys(
          programSurveys.map(x => ({
            value: x.id,
            label: <TranslatedReferenceData category="survey" value={x.id} fallback={x.name} />,
            passesFormVisibility: x.passesFormVisibility,
          })),
        );
      } catch (error) {
        if (error instanceof ForbiddenError || error?.status === 403) {
          clearProgram();
          setProgramReadError(error?.detail ?? error?.message ?? error?.title ?? null);
          return;
        }
        throw error;
      }
    },
    [api, selectedProgramId, clearProgram, setProgramRegistryIdByProgramId, patient?.id],
  );

  const submitSurveyResponse = async data => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTime(),
      answers: await getAnswersFromData(data, survey),
      facilityId,
    });
    dispatch(reloadPatient(patient.id));
    if (params?.encounterId && encounter && !encounter.endDate) {
      navigateToEncounter(params.encounterId, { tab: ENCOUNTER_TAB_NAMES.FORMS });
    } else {
      queryClient.resetQueries(['patientFields', patient.id]);
      await dispatch(reloadPatient(patient.id));
      navigateToPatient(patient.id, { tab: PATIENT_TABS.PROGRAMS });
    }
  };

  const {
    isLoading,
    data: patientAdditionalData,
    isError,
    error,
  } = usePatientAdditionalDataQuery(patient.id);

  const {
    data: existingSurveyResponse,
    isLoading: isLoadingSurveyResponse,
    isError: isSurveyResponseError,
    error: surveyResponseError,
  } = useSurveyResponseQuery(surveyResponseId, {
    enabled: Boolean(surveyResponseId),
    isErrorUnknown: isErrorUnknownAllow404s,
  });

  const surveyForEdit = useMemo(() => {
    if (!existingSurveyResponse) {
      return null;
    }
    return {
      id: existingSurveyResponse.surveyId,
      components: existingSurveyResponse.components,
    };
  }, [existingSurveyResponse]);

  const initialAnswerOverrides = useMemo(() => {
    if (!existingSurveyResponse?.answers?.length) {
      return null;
    }
    return Object.fromEntries(
      existingSurveyResponse.answers.map(a => {
        const value =
          a.originalBody !== undefined && a.originalBody !== null ? a.originalBody : a.body;
        return [a.dataElementId, value];
      }),
    );
  }, [existingSurveyResponse]);

  const submitSurveyResponseEdit = async data => {
    await api.patch(`surveyResponse/${surveyResponseId}`, {
      facilityId,
      answers: await getAnswersFromData(data, surveyForEdit),
    });
    queryClient.invalidateQueries(['surveyResponse', surveyResponseId]);
    queryClient.invalidateQueries(['surveyResponseChanges', surveyResponseId]);
    dispatch(reloadPatient(patient.id));
    if (params?.encounterId && encounter && !encounter.endDate) {
      navigateToEncounter(params.encounterId, { tab: ENCOUNTER_TAB_NAMES.FORMS });
    } else {
      queryClient.resetQueries(['patientFields', patient.id]);
      await dispatch(reloadPatient(patient.id));
      navigateToPatient(patient.id, { tab: PATIENT_TABS.PROGRAMS });
    }
  };

  const onCancelEdit = useCallback(() => {
    if (params.encounterId) {
      navigateToEncounter(params.encounterId, { tab: ENCOUNTER_TAB_NAMES.FORMS });
    } else {
      navigateToPatient(patient.id, { tab: PATIENT_TABS.PROGRAMS });
    }
  }, [navigateToEncounter, navigateToPatient, params.encounterId, patient.id]);

  if (
    isLoading ||
    (!surveyResponseId && (programsLoading || !programs)) ||
    (surveyResponseId && isLoadingSurveyResponse)
  ) {
    return <LoadingIndicator data-testid="loadingindicator-43uf" />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="program.modal.selectSurvey.error.title"
            fallback="Error"
            data-testid="translatedtext-cz5r"
          />
        }
        error={error}
        data-testid="errormessage-kl46"
      />
    );
  }

  if (surveyResponseId && isSurveyResponseError) {
    const isNotFound = surveyResponseError?.status === 404;
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="program.modal.selectSurvey.error.title"
            fallback="Error"
            data-testid="translatedtext-cz5r-survey-edit"
          />
        }
        error={
          isNotFound
            ? new Error(
                'This form response could not be loaded. It may have been deleted or you may not have access.',
              )
            : surveyResponseError
        }
        data-testid="errormessage-survey-edit"
      />
    );
  }

  if (surveyResponseId && surveyForEdit) {
    return (
      <SurveyView
        onSubmit={submitSurveyResponseEdit}
        survey={surveyForEdit}
        onCancel={onCancelEdit}
        patient={patient}
        patientAdditionalData={patientAdditionalData}
        currentUser={currentUser}
        initialAnswerOverrides={initialAnswerOverrides}
        disableCompleteUntilDirty
        data-testid="surveyview-edit"
      />
    );
  }

  if (!survey) {
    return (
      <ProgramsPane data-testid="programspane-me3f">
        <ProgramsPaneHeader data-testid="programspaneheader-99cy">
          <ProgramsPaneHeading variant="h6" data-testid="programspaneheading-csfc">
            <TranslatedText
              stringId="program.modal.selectSurvey.title"
              fallback="Select form"
              data-testid="translatedtext-wbj1"
            />
          </ProgramsPaneHeading>
        </ProgramsPaneHeader>
        <FormGrid columns={1} data-testid="formgrid-m7yd">
          <SelectInput
            name="program"
            options={programs.map(p => ({
              value: p.id,
              label: <TranslatedReferenceData category="program" value={p.id} fallback={p.name} />,
            }))}
            value={selectedProgramId}
            onChange={selectProgram}
            label={
              <TranslatedText
                stringId="program.modal.selectSurvey.selectProgram.label"
                fallback="Select program"
                data-testid="translatedtext-30u8"
              />
            }
            data-testid="selectinput-5hi2"
          />
          <SurveySelector
            onSubmit={setSelectedSurvey}
            onChange={setSelectedSurveyId}
            value={selectedSurveyId}
            surveys={surveys}
            disabled={Boolean(programReadError)}
            errorText={programReadError}
            buttonText={
              <TranslatedText
                stringId="program.modal.selectSurvey.action.begin"
                fallback="Begin survey"
                data-testid="translatedtext-htq6"
              />
            }
            data-testid="surveyselector-bn1a"
          />
        </FormGrid>
      </ProgramsPane>
    );
  }

  return (
    <SurveyView
      onSubmit={submitSurveyResponse}
      survey={survey}
      onCancel={unsetSurvey}
      patient={patient}
      patientAdditionalData={patientAdditionalData}
      currentUser={currentUser}
      data-testid="surveyview-ca4b"
    />
  );
};

export const ProgramsView = () => {
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const currentUser = useSelector(getCurrentUser);
  if (!patient.id) {
    return (
      <PatientListingView
        onViewPatient={id => dispatch(reloadPatient(id))}
        data-testid="patientlistingview-cqsa"
      />
    );
  }

  return <SurveyFlow patient={patient} currentUser={currentUser} data-testid="surveyflow-b2d8" />;
};
