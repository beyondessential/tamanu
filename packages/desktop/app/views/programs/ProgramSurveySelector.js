import React, { useState, useCallback, useEffect } from 'react';

import { useApi } from 'desktop/app/api';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { SelectInput } from 'desktop/app/components/Field/SelectField';

import { SURVEY_TYPES } from 'shared/constants';

import { PatientDisplay } from './PatientDisplay';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { SurveySelector } from './SurveySelector';

export const ProgramSurveySelector = React.memo(({ onSelectSurvey, programs }) => {
  const api = useApi();
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [surveyOptions, setSurveyOptions] = useState(null);
  const [programOptions, setProgramOptions] = useState(null);

  useEffect(() => {
    setProgramOptions(programs.map(x => ({ value: x.id, label: x.name })));
  }, [programs]);

  const onChangeProgram = useCallback(async event => {
    const programId = event.target.value;
    if (programId === selectedProgramId) {
      return;
    }

    setSelectedProgramId(programId);

    const { data: surveys } = await api.get(`program/${programId}/surveys`);
    setSurveyOptions(
      surveys
        .filter(s => s.surveyType === SURVEY_TYPES.PROGRAMS)
        .map(x => ({ value: x.id, label: x.name })),
    );
  });

  return (
    <>
      <PatientDisplay />
      <ProgramsPane>
        <ProgramsPaneHeader>
          <ProgramsPaneHeading variant="h6">Select a survey</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        <FormGrid columns={1}>
          <SelectInput
            options={programOptions}
            value={selectedProgramId}
            onChange={onChangeProgram}
            label="Select program"
          />
          <SurveySelector
            onSelectSurvey={onSelectSurvey}
            surveys={surveyOptions}
            buttonText="Begin survey"
          />
        </FormGrid>
      </ProgramsPane>
    </>
  );
});
