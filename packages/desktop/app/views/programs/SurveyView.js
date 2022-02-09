import React, { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Typography } from '@material-ui/core';
import { Form, Field } from 'desktop/app/components/Field';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { Button, OutlinedButton } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import {
  checkVisibility,
  getComponentForQuestionType,
  mapOptionsToValues,
  getFormInitialValues,
  getConfigObject,
} from 'desktop/app/utils';
import { runCalculations } from 'shared-src/src/utils/calculations';

import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { PatientDisplay } from './PatientDisplay';

const Text = styled.div`
  margin-bottom: 10px;
`;

const SurveyQuestion = ({ component }) => {
  const {
    dataElement,
    detail,
    config: componentConfig,
    options: componentOptions,
    text: componentText,
  } = component;
  const { defaultText, type, defaultOptions, id } = dataElement;
  const text = componentText || defaultText;
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const FieldComponent = getComponentForQuestionType(type);

  if (!FieldComponent) return <Text>{text}</Text>;

  return (
    <Field
      label={text}
      component={FieldComponent}
      name={id}
      options={options}
      config={getConfigObject(id, componentConfig)}
      helperText={detail}
    />
  );
};

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

export const SurveyScreen = ({ components, values, onStepForward, onStepBack }) => {
  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => <SurveyQuestion component={c} key={c.id} />);

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

export const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <Typography variant="h6" gutterBottom>
      Survey complete
    </Typography>
    <Text>{COMPLETE_MESSAGE}</Text>
    <div>
      <StyledButtonRow>
        <OutlinedButton onClick={onStepBack}>Prev</OutlinedButton>
        <Button color="primary" variant="contained" onClick={onSurveyComplete}>
          Complete
        </Button>
      </StyledButtonRow>
    </div>
  </div>
);

export const usePaginatedForm = () => {
  const [screenIndex, setScreenIndex] = useState(0);

  const onStepBack = () => {
    setScreenIndex(screenIndex - 1);
  };

  const onStepForward = () => {
    setScreenIndex(screenIndex + 1);
  };

  const handleStep = step => () => {
    setScreenIndex(step);
  };

  return {
    onStepBack,
    onStepForward,
    handleStep,
    screenIndex,
    setScreenIndex,
  };
};

export const useFormValues = (components, values, setFieldValue) => {
  useEffect(() => {
    // recalculate dynamic fields
    const calculatedValues = runCalculations(components, values);
    // write values that have changed back into answers
    Object.entries(calculatedValues)
      .filter(([k, v]) => values[k] !== v)
      .map(([k, v]) => setFieldValue(k, v));
  }, [components, values, setFieldValue]);
};

export const SurveyScreenPaginator = ({
  survey,
  values,
  onSurveyComplete,
  onCancel,
  setFieldValue,
}) => {
  const { components } = survey;
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm(components);

  useFormValues(components, values, setFieldValue);

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
        screenIndex={screenIndex}
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

export const SurveyView = ({ survey, onSubmit, onCancel, patient, currentUser }) => {
  const { components } = survey;
  const initialValues = getFormInitialValues(components, patient, currentUser);

  const [surveyCompleted, setSurveyCompleted] = useState(true);

  const onSubmitSurvey = useCallback(
    async data => {
      await onSubmit(data);
      setSurveyCompleted(true);
    },
    [onSubmit],
  );

  const renderSurvey = props => {
    const { submitForm, values, setFieldValue } = props;

    return (
      <SurveyScreenPaginator
        survey={survey}
        values={values}
        setFieldValue={setFieldValue}
        onSurveyComplete={submitForm}
        onCancel={onCancel}
      />
    );
  };

  const surveyContents = surveyCompleted ? (
    <SurveyCompletedMessage onResetClicked={onCancel} />
  ) : (
    <Form initialValues={initialValues} onSubmit={onSubmitSurvey} render={renderSurvey} />
  );

  return (
    <>
      <PatientDisplay surveyCompleted={surveyCompleted} />
      <ProgramsPane>
        <ProgramsPaneHeader>
          <ProgramsPaneHeading variant="h6">{survey.name} 12</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        {surveyContents}
      </ProgramsPane>
    </>
  );
};
