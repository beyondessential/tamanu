import React, { useCallback, useState } from 'react';
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
  const { text, type, code, options, detail } = question;
  if (type === 'Instruction') {
    return <div>{text}</div>;
  }

  const FieldComponent = QUESTION_COMPONENTS[type] || QUESTION_COMPONENTS.default;

  return (
    <Field
      label={text}
      component={FieldComponent}
      name={code}
      options={options}
      helpText={detail}
    />
  );
};

function checkVisibility({ visibilityCriteria }, values) {
  if (!visibilityCriteria) return true;

  const [key, requiredValue] = visibilityCriteria.split(':').map(x => x.trim());
  const formValue = values[key];

  const sanitisedValue = (requiredValue || '').toLowerCase().trim();

  if (typeof formValue === 'boolean') {
    if (formValue && sanitisedValue === 'yes') return true;
    if (!formValue && sanitisedValue === 'no') return true;
  }

  if (sanitisedValue === (formValue || '').toLowerCase().trim()) return true;

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

const SurveyCompletedMessage = React.memo(({ onResetClicked }) => (
  <div>
    <p>Your response has been successfully submitted.</p>
    <ButtonRow>
      <Button variant="contained" color="primary" onClick={onResetClicked}>
        New survey
      </Button>
    </ButtonRow>
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

  const initialValues = {};
  survey.screens.forEach(s => {
    s.questions.forEach(q => {
      initialValues[q.code] = getInitialValue(q);
    });
  });

  const surveyContents = surveyCompleted ? (
    <SurveyCompletedMessage onResetClicked={onCancel} />
  ) : (
    <Form onSubmit={onSubmitSurvey} render={renderSurvey} initialValues={initialValues} />
  );

  return (
    <ContentPane>
      <PatientDisplay />
      <hr />
      <h2>{survey.name}</h2>
      {surveyContents}
    </ContentPane>
  );
};
