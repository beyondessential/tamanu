import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';
import { reloadPatient } from '../../store/patient';
import { getCurrentUser } from '../../store/auth';
import { SurveyView } from './SurveyView';
import { SurveySelector } from './SurveySelector';
import { FormGrid } from '../../components/FormGrid';
import { SelectInput } from '../../components/Field/SelectField';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PatientListingView } from '..';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getAnswersFromData, getActionsFromData } from '../../utils';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useEncounter } from '../../contexts/Encounter';
import { PATIENT_TABS } from '../../constants/patientPaths';
import { ENCOUNTER_TAB_NAMES } from '../../constants/encounterTabNames';
import { useApi } from '../../api';

const SurveyFlow = ({ patient, currentUser }) => {
  const api = useApi();
  const params = useParams();
  const { encounter, loadEncounter } = useEncounter();
  const { navigateToEncounter, navigateToPatient } = usePatientNavigation();
  const [survey, setSurvey] = useState(null);
  const [programs, setPrograms] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [surveys, setSurveys] = useState(null);

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
      setStartTime(getCurrentDateTimeString());
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

      if (!programId) {
        clearProgram();
        return;
      }

      const { data } = await api.get(`program/${programId}/surveys`);
      setSurveys(
        data
          .filter(s => s.surveyType === SURVEY_TYPES.PROGRAMS)
          .map(x => ({ value: x.id, label: x.name })),
      );
    },
    [api, selectedProgramId, clearProgram],
  );

  const submitSurveyResponse = async data => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, survey),
      actions: getActionsFromData(data, survey),
    });
    if (params?.encounterId && encounter && !encounter.endDate) {
      navigateToEncounter(params.encounterId, { tab: ENCOUNTER_TAB_NAMES.FORMS });
    } else {
      navigateToPatient(patient.id, { tab: PATIENT_TABS.PROGRAMS });
    }
  };

  const { isLoading, data: patientAdditionalData, isError, error } = usePatientAdditionalDataQuery(
    patient.id,
  );

  if (isLoading || !programs) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return <ErrorMessage title="Error" error={error} />;
  }

  if (!survey) {
    return (
      <ProgramsPane>
        <ProgramsPaneHeader>
          <ProgramsPaneHeading variant="h6">Select form</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        <FormGrid columns={1}>
          <SelectInput
            options={programs.map(p => ({ value: p.id, label: p.name }))}
            value={selectedProgramId}
            onChange={selectProgram}
            label="Select program"
          />
          <SurveySelector
            onSubmit={setSelectedSurvey}
            onChange={setSelectedSurveyId}
            value={selectedSurveyId}
            surveys={surveys}
            buttonText="Begin form"
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
    />
  );
};

export const ProgramsView = () => {
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const currentUser = useSelector(getCurrentUser);
  if (!patient.id) {
    return <PatientListingView onViewPatient={id => dispatch(reloadPatient(id))} />;
  }

  return <SurveyFlow patient={patient} currentUser={currentUser} />;
};
