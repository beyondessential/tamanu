import React, { useState, useCallback, useEffect } from 'react';

import { Button } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import { ContentPane } from 'desktop/app/components/ContentPane';
import { FormGrid } from 'desktop/app/components/FormGrid';

import { SelectInput } from 'desktop/app/components/Field/SelectField';

import { PatientDisplay } from './PatientDisplay';

export const SurveySelector = React.memo(({ onSelectSurvey, programs }) => {
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [surveyOptions, setSurveyOptions] = useState(null);
  const [programOptions, setProgramOptions] = useState(null);

  useEffect(() => {
    setProgramOptions(programs.map(x => ({ value: x.id, label: x.name })));
  }, [programs]);

  const onChangeProgram = useCallback(event => {
    const programId = event.target.value;
    const program = programs.find(x => x.id === programId);
    if (programId === selectedProgramId) {
      return;
    }
    setSelectedProgramId(programId);
    setSelectedSurveyId(null);
    setSurveyOptions(program.surveys.map(x => ({ value: x.id, label: x.name })));
  });

  const onChangeSurvey = useCallback(event => {
    const surveyId = event.target.value;
    setSelectedSurveyId(surveyId);
  });

  const onSubmit = useCallback(() => {
    onSelectSurvey(selectedSurveyId);
  }, [selectedSurveyId]);

  return (
    <ContentPane>
      <PatientDisplay />
      <hr />
      <FormGrid columns={1}>
        <div>Please select a survey.</div>
        <SelectInput
          options={programOptions}
          value={selectedProgramId}
          onChange={onChangeProgram}
          label="Select program"
        />
        <SelectInput
          options={surveyOptions}
          value={selectedSurveyId}
          onChange={onChangeSurvey}
          disabled={!selectedProgramId}
          label="Select survey"
        />
        <ButtonRow>
          <Button
            onClick={onSubmit}
            disabled={!selectedSurveyId}
            variant="contained"
            color="primary"
          >
            Begin survey
          </Button>
        </ButtonRow>
      </FormGrid>
    </ContentPane>
  );
});
