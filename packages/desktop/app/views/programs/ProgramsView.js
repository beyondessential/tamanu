import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import {
  Form,
  Field,
  TextField,
  NumberField,
  SelectField,
} from 'desktop/app/components/Field';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { Button } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import { ContentPane } from 'desktop/app/components/ContentPane';

const ScreenContainer = styled.div`
  
`;

const QuestionContainer = styled.div`
  
`;

const QUESTION_COMPONENTS = {
  number: NumberField,
  text: TextField,
  select: SelectField,
  default: TextField,
};

const SurveyQuestion = ({ question }) => {
  const { text } = question;
  const FieldComponent = QUESTION_COMPONENTS[question.type] || QUESTION_COMPONENTS.default;

  return (
    <QuestionContainer>
      <div>{ question.text }</div>
      <Field
        component={FieldComponent}
        name={question._id}
      />
    </QuestionContainer>
  );
};

const SurveyScreen = ({ screen, onStepForward, onStepBack }) => {
  const { questions } = screen;

  const questionElements = questions.map(q => <SurveyQuestion question={q} key={q._id} />);

  return (
    <FormGrid columns={1}>
      { questionElements }
      <ButtonRow>
        <Button variant="contained" onClick={onStepBack || undefined} disabled={!onStepBack}>Back</Button>
        <Button variant="contained" onClick={onStepForward}>Forward</Button>
      </ButtonRow>
    </FormGrid>
  );
};

const SurveySummaryScreen = ({ onStepBack, onSurveyComplete }) => {
  return (
    <div>
      <div>Nice one. You did it.</div>
      <div>
        <ButtonRow>
          <Button variant="contained" onClick={onStepBack}>Back</Button>
          <Button color="primary" variant="contained" onClick={onSurveyComplete}>Complete</Button>
        </ButtonRow>
      </div>
    </div>
  );
};

const SurveyScreenPaginator = ({ survey, onSurveyComplete }) => {
  const { screens } = survey;
  const [screenIndex, setScreenIndex] = React.useState(0);

  const onStepBack = useCallback(() => {
    setScreenIndex(screenIndex - 1);
  }, [screenIndex]);

  const onStepForward = useCallback(() => {
    setScreenIndex(screenIndex + 1);
  }, [screenIndex]);

  if(screenIndex < screens.length) {
    return (
      <SurveyScreen 
        screen={screens[screenIndex]} 
        onStepForward={onStepForward} 
        onStepBack={screenIndex > 0 && onStepBack} 
      />
    );
  }

  return (
    <SurveySummaryScreen 
      onStepBack={onStepBack}
      onSurveyComplete={onSurveyComplete}
    />
  );
};

export const SurveyView = ({ survey }) => {
  const renderSurvey = useCallback(({ submitForm }) => (
    <SurveyScreenPaginator survey={survey} onSurveyComplete={submitForm} />
  ));

  const onSubmit = useCallback(data => {
    console.log(data);
  });

  return (
    <ContentPane>
      <Form
        onSubmit={onSubmit}
        render={renderSurvey}
      />
    </ContentPane>
  );
};
