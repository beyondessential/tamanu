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
  const { text, type } = question;
  if (type === 'Instruction') {
    return <QuestionContainer>{text}</QuestionContainer>;
  }

  const FieldComponent = QUESTION_COMPONENTS[type] || QUESTION_COMPONENTS.default;

  return (
    <QuestionContainer>
      <div>{text}</div>
      <Field component={FieldComponent} name={question.code} />
    </QuestionContainer>
  );
};

const SurveyScreen = ({ screen, onStepForward, onStepBack }) => {
  const { questions } = screen;

  const questionElements = questions.map(q => <SurveyQuestion question={q} key={q._id} />);

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

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <div>Nice one. You did it.</div>
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

const SurveyScreenPaginator = ({ survey, onSurveyComplete, onCancel }) => {
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

export const SurveyView = ({ survey, onCancel }) => {
  const renderSurvey = useCallback(({ submitForm }) => (
    <SurveyScreenPaginator survey={survey} onSurveyComplete={submitForm} onCancel={onCancel} />
  ));

  const onSubmit = useCallback(data => {
    console.log(data);
  });

  const initialValues = {};
  survey.screens.forEach(s => {
    s.questions.forEach(q => {
      initialValues[q.code] = getInitialValue(q);
    });
  });

  return (
    <ContentPane>
      <h2>{survey.name}</h2>
      <Form onSubmit={onSubmit} render={renderSurvey} initialValues={initialValues} />
    </ContentPane>
  );
};
