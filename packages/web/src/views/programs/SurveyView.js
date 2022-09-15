import React, { useCallback, useState, useEffect } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Typography } from '@material-ui/core';
import { runCalculations } from 'shared/utils/calculations';
import { Form, Field, usePaginatedForm } from '../../components/Field';
import { FormGrid } from '../../components/FormGrid';
import { Button, OutlinedButton } from '../../components/Button';
import { ButtonRow } from '../../components/ButtonRow';
import {
  checkVisibility,
  getComponentForQuestionType,
  mapOptionsToValues,
  getFormInitialValues,
  getConfigObject,
} from '../../utils';
import { ProgramsPane, ProgramsPaneHeader, ProgramsPaneHeading } from './ProgramsPane';
import { Colors } from '../../constants';

const Text = styled.div`
  margin-bottom: 10px;
`;

export const SurveyPaneHeader = styled(ProgramsPaneHeader)`
  background: ${props => props.theme.palette.primary.main};
  text-align: center;
  border-top-right-radius: 3px;
  border-top-left-radius: 3px;
`;

export const SurveyPaneHeading = styled(ProgramsPaneHeading)`
  color: ${Colors.white};
`;

const SurveyQuestion = ({ component, patient }) => {
  const {
    dataElement,
    detail,
    config: componentConfig,
    options: componentOptions,
    text: componentText,
  } = component;
  const { defaultText, type, defaultOptions, id } = dataElement;
  const configObject = getConfigObject(id, componentConfig);
  const text = componentText || defaultText;
  const options = mapOptionsToValues(componentOptions || defaultOptions);
  const FieldComponent = getComponentForQuestionType(type, configObject);

  if (!FieldComponent) return <Text>{text}</Text>;

  return (
    <Field
      label={text}
      component={FieldComponent}
      patient={patient}
      name={id}
      options={options}
      config={configObject}
      helperText={detail}
    />
  );
};

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const SurveyScreen = ({ components, values, onStepForward, onStepBack, patient }) => {
  const questionElements = components
    .filter(c => checkVisibility(c, values, components))
    .map(c => <SurveyQuestion component={c} patient={patient} key={c.id} />);

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

const useCalculatedFormValues = (components, values, setFieldValue) => {
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
  patient,
}) => {
  const { components } = survey;
  const { onStepBack, onStepForward, screenIndex } = usePaginatedForm(components);

  useCalculatedFormValues(components, values, setFieldValue);

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
        patient={patient}
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
    const { submitForm, values, setFieldValue, setValues } = props;

    // 1. get a list of visible fields
    const submitVisibleValues = event => {
      const visibleFields = new Set(
        components.filter(c => checkVisibility(c, values, components)).map(x => x.dataElementId),
      );

      // 2. Filter the form values to only include visible fields
      const visibleValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => visibleFields.has(key)),
      );

      // 3. Set visible values in form state
      setValues(visibleValues);
      submitForm(event);
    };

    return (
      <SurveyScreenPaginator
        survey={survey}
        patient={patient}
        values={values}
        setFieldValue={setFieldValue}
        onSurveyComplete={submitVisibleValues}
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
    <ProgramsPane>
      <SurveyPaneHeader>
        <SurveyPaneHeading variant="h6">{survey.name}</SurveyPaneHeading>
      </SurveyPaneHeader>
      {surveyContents}
    </ProgramsPane>
  );
};
