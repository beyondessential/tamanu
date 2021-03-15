import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Typography } from '@material-ui/core';

import {
  Form,
  Field,
  TextField,
  MultilineTextField,
  SelectField,
  MultiselectField,
  DateField,
  NullableBooleanField,
  AutocompleteField,
  NumberField,
} from 'desktop/app/components/Field';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { Button, OutlinedButton } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';

import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { PatientDisplay } from './PatientDisplay';

const SURVEY_FIELD_TYPES = {
  TEXT: 'FreeText',
  MULTILINE: 'Multiline',
  RADIO: 'Radio',
  SELECT: 'Select',
  MULTI_SELECT: 'MultiSelect',
  AUTOCOMPLETE: 'Autocomplete',
  DATE: 'Date',
  SUBMISSION_DATE: 'SubmissionDate',
  INSTRUCTION: 'Instruction',
  NUMBER: 'Number',
  BINARY: 'Binary',
  CHECKBOX: 'Checkbox',
  CALCULATED: 'CalculatedQuestion',
  CONDITION: 'ConditionQuestion',
  RESULT: 'Result',
  SURVEY_ANSWER: 'SurveyAnswer',
  SURVEY_RESULT: 'SurveyResult',
  SURVEY_LINK: 'SurveyLink',
};

const QUESTION_COMPONENTS = {
  [SURVEY_FIELD_TYPES.TEXT]: TextField,
  [SURVEY_FIELD_TYPES.MULTILINE]: MultilineTextField,
  [SURVEY_FIELD_TYPES.RADIO]: SelectField, // TODO: Implement proper radio field.
  [SURVEY_FIELD_TYPES.SELECT]: SelectField,
  [SURVEY_FIELD_TYPES.MULTI_SELECT]: MultiselectField,
  [SURVEY_FIELD_TYPES.AUTOCOMPLETE]: AutocompleteField,
  [SURVEY_FIELD_TYPES.DATE]: DateField,
  [SURVEY_FIELD_TYPES.SUBMISSION_DATE]: DateField,
  [SURVEY_FIELD_TYPES.NUMBER]: NumberField,
  [SURVEY_FIELD_TYPES.BINARY]: NullableBooleanField,
  [SURVEY_FIELD_TYPES.CHECKBOX]: NullableBooleanField,
  // [SURVEY_FIELD_TYPES.CALCULATED]: ReadOnlyField,
  // [SURVEY_FIELD_TYPES.SURVEY_LINK]: SurveyLink,
  // [SURVEY_FIELD_TYPES.SURVEY_RESULT]: SurveyResult,
  // [SURVEY_FIELD_TYPES.SURVEY_ANSWER]: SurveyAnswerField,
  [SURVEY_FIELD_TYPES.INSTRUCTION]: null,
  // [SURVEY_FIELD_TYPES.RESULT]: null,
};

function mapOptionsToValues(options) {
  if (!options) return null;
  return options.map(x => ({ label: x, value: x }));
}

const Text = styled.div`
  margin-bottom: 10px;
`;

const SurveyQuestion = ({ component }) => {
  const { defaultText, type, id, defaultOptions, detail } = component.dataElement;
  const text = component.text || defaultText;
  const options = mapOptionsToValues(component.options || defaultOptions);

  if (type === SURVEY_FIELD_TYPES.INSTRUCTION) {
    return <Text>{text}</Text>;
  }

  const FieldComponent = QUESTION_COMPONENTS[type] || QUESTION_COMPONENTS[SURVEY_FIELD_TYPES.TEXT];

  return (
    <Field
      label={text}
      component={FieldComponent}
      name={id}
      options={options}
      helperText={detail}
    />
  );
};

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

function checkVisibility({ visibilityCriteria, dataElement }, values, components) {
  if ([SURVEY_FIELD_TYPES.RESULT, SURVEY_FIELD_TYPES.CALCULATED].includes(dataElement.type))
    return false;
  if (!visibilityCriteria) return true;

  const [code, requiredValue] = visibilityCriteria.split(':').map(x => x.trim());
  const referencedComponent = components.find(c => c.dataElement.code === code);
  if (!referencedComponent) return true;

  const key = referencedComponent.dataElement.id;
  const formValue = values[key];

  const sanitisedValue = (requiredValue || '').toLowerCase().trim();

  if (typeof formValue === 'boolean') {
    if (formValue && sanitisedValue === 'yes') return true;
    if (!formValue && sanitisedValue === 'no') return true;
  }

  if (sanitisedValue === (formValue || '').toLowerCase().trim()) return true;

  return false;
}

const SurveyScreen = ({ components, values, onStepForward, onStepBack }) => {
  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => <SurveyQuestion component={c} key={c.id} />);
  console.log('values', values)
  return (
    <FormGrid columns={1}>
      {questionElements}
      <StyledButtonRow>
        <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
          Prev
        </OutlinedButton>
        <Button color="primary" variant="contained" onClick={onStepForward}>
          Next
        </Button>
      </StyledButtonRow>
    </FormGrid>
  );
};

const COMPLETE_MESSAGE = `
  Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <Typography variant="h6" gutterBottom>Survey Complete</Typography>
    <Text>{COMPLETE_MESSAGE}</Text>
    <div>
      <StyledButtonRow>
        <OutlinedButton onClick={onStepBack}>
          Prev
        </OutlinedButton>
        <Button color="primary" variant="contained" onClick={onSurveyComplete}>
          Complete
        </Button>
      </StyledButtonRow>
    </div>
  </div>
);

const SurveyScreenPaginator = ({ survey, values, onSurveyComplete, onCancel }) => {
  const { components } = survey;
  const [screenIndex, setScreenIndex] = useState(0);

  const onStepBack = useCallback(() => {
    setScreenIndex(screenIndex - 1);
  }, [screenIndex]);

  const onStepForward = useCallback(() => {
    setScreenIndex(screenIndex + 1);
  }, [screenIndex]);

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);
  if (screenIndex <= maxIndex) {
    const screenComponents = components
      .filter(x => x.screenIndex === screenIndex)
      .sort((a, b) => a.componentIndex - b.componentIndex);
    return (
      <SurveyScreen
        values={values}
        components={screenComponents}
        onStepForward={onStepForward}
        onStepBack={screenIndex > 0 ? onStepBack : onCancel}
      />
    );
  }

  return <SurveySummaryScreen onStepBack={onStepBack} onSurveyComplete={onSurveyComplete} />;
};

const StyledAlert = styled(Alert)`
  margin: 15px 0;
`;

const SurveyCompletedMessage = React.memo(({ onResetClicked }) => (
  <div>
    <StyledAlert severity="success">Your response has been successfully submitted.</StyledAlert>
    <StyledButtonRow>
      <Button variant="contained" color="primary" onClick={onResetClicked}>
        New survey
      </Button>
    </StyledButtonRow>
  </div>
));


export const SurveyView = ({ survey, onSubmit, onCancel }) => {
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  const onSubmitSurvey = useCallback(async data => {
    await onSubmit(data);
    setSurveyCompleted(true);
  });

  const renderSurvey = useCallback(({ submitForm, values }) => (
    <SurveyScreenPaginator
      survey={survey}
      values={values}
      onSurveyComplete={submitForm}
      onCancel={onCancel}
    />
  ));

  const surveyContents = surveyCompleted ? (
    <SurveyCompletedMessage onResetClicked={onCancel} />
  ) : (
    <Form onSubmit={onSubmitSurvey} render={renderSurvey} />
  );

  return (
    <>
      <PatientDisplay />
      <ProgramsPane>
        <ProgramsPaneHeader>
          <ProgramsPaneHeading variant="h6">{survey.name}</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        {surveyContents}
      </ProgramsPane>
    </>
  );
};
