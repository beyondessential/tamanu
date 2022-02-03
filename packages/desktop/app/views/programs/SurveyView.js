import React, { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Typography } from '@material-ui/core';

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepLabel from '@material-ui/core/StepLabel';
import Tooltip from '@material-ui/core/Tooltip';

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

const SurveyScreen = ({ components, values, onStepForward, onStepBack, Stepper }) => {
  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => <SurveyQuestion component={c} key={c.id} />);

  return (
    <div>
      <Typography variant="h6">Record patient death</Typography>
      {Stepper}
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
    </div>
  );
};

const COMPLETE_MESSAGE = `
  Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
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

const StyledStepper = styled(Stepper)`
  padding: 0;
  margin-top: 10px;
`;

const StyledStep = styled(Step)`
  display: flex;
  flex: 1;
  margin: 0 3px 0 0;
  padding: 0;

  &:last-child {
    margin: 0;
  }
`;

const StyledStepButton = styled(StepButton)`
  background: ${props => props.theme.palette.primary.main};
  border-radius: 0;
  height: 10px;
  padding: 0;
  margin: 0;
`;

export const SurveyScreenPaginator = ({
  survey,
  values,
  onSurveyComplete,
  onCancel,
  setFieldValue,
}) => {
  const { components } = survey;
  const [screenIndex, setScreenIndex] = useState(0);

  useEffect(() => {
    // recalculate dynamic fields
    const calculatedValues = runCalculations(components, values);
    // write values that have changed back into answers
    Object.entries(calculatedValues)
      .filter(([k, v]) => values[k] !== v)
      .map(([k, v]) => setFieldValue(k, v));
  }, [components, values, setFieldValue]);

  const onStepBack = useCallback(() => {
    setScreenIndex(screenIndex - 1);
  }, [screenIndex]);

  const onStepForward = useCallback(() => {
    setScreenIndex(screenIndex + 1);
  }, [screenIndex]);

  const maxIndex = components
    .map(x => x.screenIndex)
    .reduce((max, current) => Math.max(max, current), 0);

  const handleStep = step => () => {
    setScreenIndex(step);
  };

  if (screenIndex <= maxIndex) {
    const screenComponents = components
      .filter(x => x.screenIndex === screenIndex)
      .sort((a, b) => a.componentIndex - b.componentIndex);

    const steps = components
      .filter(c => c.dataElement.type === 'Instruction')
      .map(c => c.dataElement.name);

    return (
      <SurveyScreen
        values={values}
        components={screenComponents}
        onStepForward={onStepForward}
        screenIndex={screenIndex}
        onStepBack={screenIndex > 0 ? onStepBack : onCancel}
        Stepper={
          <StyledStepper nonLinear activeStep={screenIndex} connector={null}>
            {steps.map((label, index) => {
              return (
                <StyledStep key={label}>
                  <Tooltip title={label}>
                    <StyledStepButton onClick={handleStep(index)} icon={null} />
                  </Tooltip>
                </StyledStep>
              );
            })}
          </StyledStepper>
        }
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

  const [surveyCompleted, setSurveyCompleted] = useState(false);

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
          <ProgramsPaneHeading variant="h6">{survey.name}</ProgramsPaneHeading>
        </ProgramsPaneHeader>
        {surveyContents}
      </ProgramsPane>
    </>
  );
};
