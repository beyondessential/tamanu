import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import {
  Form,
  Field,
  TextField,
  SelectField,
  DateField,
  CheckField,
} from 'desktop/app/components/Field';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { Button } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import { ContentPane } from 'desktop/app/components/ContentPane';

import { PatientDisplay } from './PatientDisplay';

const QuestionContainer = styled.div``;

const QUESTION_COMPONENTS = {
  Instruction: null,
  Date: DateField,
  FreeText: TextField,
  Radio: SelectField,

  Binary: CheckField,
  Checkbox: CheckField,

  default: TextField,
};

const SurveyQuestion = ({ question }) => {
  const { text, type, code, options } = question;
  if (type === 'Instruction') {
    return <QuestionContainer>{text}</QuestionContainer>;
  }

  const FieldComponent = QUESTION_COMPONENTS[type] || QUESTION_COMPONENTS.default;

  return (
    <QuestionContainer>
      <Field label={text} component={FieldComponent} name={code} options={options} />
    </QuestionContainer>
  );
};

function checkVisibility({ visibilityCriteria }, values) {
  if(!visibilityCriteria) return true;

  let [key, requiredValue] = visibilityCriteria.split(":").map(x => x.trim());
  const formValue = values[key];

  requiredValue = (requiredValue || "").toLowerCase().trim();
  
  if(typeof formValue === 'boolean') {
    if(formValue && requiredValue === 'yes') return true;
    if(!formValue && requiredValue === 'no') return true;
  }

  if(requiredValue === (formValue || "").toLowerCase().trim()) return true;

  return false;
}

const SurveyScreen = ({ screen, values, onStepForward, onStepBack }) => {
  const { questions } = screen;

  const questionElements = questions
    .filter(q => checkVisibility(q, values))
    .map(q => <SurveyQuestion question={q} key={q._id} />);

  return (
    <FormGrid columns={1}>
      {questionElements}
      <ButtonRow>
        <Button variant="contained" onClick={onStepBack || undefined} disabled={!onStepBack}>
          Back
        </Button>
        <Button variant="contained" onClick={onStepForward}>
          Forward
        </Button>
      </ButtonRow>
    </FormGrid>
  );
};

const COMPLETE_MESSAGE = `
  Survey complete. Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <div>{COMPLETE_MESSAGE}</div>
    <div>
      <ButtonRow>
        <Button variant="contained" onClick={onStepBack}>
          Back
        </Button>
        <Button color="primary" variant="contained" onClick={onSurveyComplete}>
          Complete
        </Button>
      </ButtonRow>
    </div>
  </div>
);

const SurveyScreenPaginator = ({ survey, values, onSurveyComplete, onCancel }) => {
  const { screens } = survey;
  const [screenIndex, setScreenIndex] = useState(0);

  const onStepBack = useCallback(() => {
    setScreenIndex(screenIndex - 1);
  }, [screenIndex]);

  const onStepForward = useCallback(() => {
    setScreenIndex(screenIndex + 1);
  }, [screenIndex]);

  if (screenIndex < screens.length) {
    return (
      <SurveyScreen
        values={values}
        screen={screens[screenIndex]}
        onStepForward={onStepForward}
        onStepBack={screenIndex > 0 ? onStepBack : onCancel}
      />
    );
  }

  return <SurveySummaryScreen onStepBack={onStepBack} onSurveyComplete={onSurveyComplete} />;
};

function getInitialValue(q) {
  switch (q.type) {
    case 'FreeText':
      return '';

    case 'Binary':
    case 'Checkbox':
      return false;
    case 'Radio':
    case 'Instruction':
    case 'Date':
    default:
      return null;
  }
}

export const SurveyView = ({ survey, onSubmit, onCancel }) => {
  const renderSurvey = useCallback(({ submitForm, values }) => (
    <SurveyScreenPaginator 
      survey={survey} 
      values={values} 
      onSurveyComplete={submitForm}
      onCancel={onCancel} 
    />
  ));

  const initialValues = {};
  survey.screens.forEach(s => {
    s.questions.forEach(q => {
      initialValues[q.code] = getInitialValue(q);
    });
  });

  return (
    <ContentPane>
      <PatientDisplay />
      <hr />
      <h2>{survey.name}</h2>
      <Form onSubmit={onSubmit} render={renderSurvey} initialValues={initialValues} />
    </ContentPane>
  );
};
