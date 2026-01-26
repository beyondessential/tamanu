import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { getAnswersFromData, SelectInput, FormGrid, useDateTimeFormat } from '@tamanu/ui-components';
import { SURVEY_TYPES } from '@tamanu/constants';
import { reloadPatient } from '../../store/patient';
import { getCurrentUser } from '../../store/auth';
import { SurveyView } from './SurveyView';
import { SurveySelector } from './SurveySelector';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientListingView } from '..';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { ErrorMessage } from '../../components/ErrorMessage';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useEncounter } from '../../contexts/Encounter';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { useApi } from '../../api';
import { useProgramRegistryContext } from '../../contexts/ProgramRegistry';
import { useAuth } from '../../contexts/Auth';
import { TranslatedReferenceData } from '../../components';

const SurveyFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const params = useParams();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { encounter, loadEncounter } = useEncounter();
  const { navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const [survey, setSurvey] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [surveys, setSurveys] = useState(null);
  const { setProgramRegistryIdByProgramId } = useProgramRegistryContext();

  useEffect(() => {
    if (params.encounterId) {
      loadEncounter(params.encounterId);
    }
  }, [loadEncounter, params.encounterId]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('program');
      setPrograms(data);
    })();
  }, [api]);

  const setSelectedSurvey = useCallback(
    async id => {
      const response = await api.get(`survey/${encodeURIComponent(id)}`);
      setSurvey(response);
      setStartTime(getCountryCurrentDateTimeString());
    },
    [api],
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

      if (!programId) {
        clearProgram();
        return;
      }

      const { data } = await api.get(`program/${programId}/surveys`);
      setSurveys(
        data
          .filter(s => s.surveyType === SURVEY_TYPES.PROGRAMS)
          .map(x => ({
            value: x.id,
            label: <TranslatedReferenceData category="survey" value={x.id} fallback={x.name} />,
          })),
      );
    },
    [api, selectedProgramId, clearProgram, setProgramRegistryIdByProgramId],
  );

  const submitSurveyResponse = async data => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      endTime: getCountryCurrentDateTimeString(),
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

  const { isLoading, data: patientAdditionalData, isError, error } = usePatientAdditionalDataQuery(
    patient.id,
  );

  if (isLoading || !programs) {
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
