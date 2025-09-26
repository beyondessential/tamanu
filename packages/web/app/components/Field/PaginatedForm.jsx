import React, { useState } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { omit } from 'lodash';
import { Box, Typography } from '@material-ui/core';
import {
  Form,
  Button,
  OutlinedButton,
  ButtonRow,
  usePaginatedForm,
  TranslatedText,
} from '@tamanu/ui-components';

import { getInvisibleQuestions, getVisibleQuestions } from '../../utils';
import { FormStepper } from './FormStepper';

const DefaultSummaryScreen = ({ onStepBack, submitForm }) => (
  <div>
    <Typography variant="h6" gutterBottom data-testid="typography-cq81">
      <TranslatedText
        stringId="paginatedForm.summary.heading"
        fallback="Form complete"
        data-testid="translatedtext-wmic"
      />
    </Typography>
    <Typography data-testid="typography-nw54">
      <TranslatedText
        stringId="paginatedForm.summary.completeMessage"
        fallback='Press "Complete" to submit your response, or use the Back button to review answers.'
        data-testid="translatedtext-4bu5"
      />
    </Typography>
    <div>
      <ButtonRow data-testid="buttonrow-4ggp">
        <OutlinedButton onClick={onStepBack} data-testid="outlinedbutton-64dj">
          <TranslatedText
            stringId="general.action.previous"
            fallback="Prev"
            data-testid="translatedtext-01cw"
          />
        </OutlinedButton>
        <Button color="primary" variant="contained" onClick={submitForm} data-testid="button-5uyu">
          <TranslatedText
            stringId="general.action.complete"
            fallback="Complete"
            data-testid="translatedtext-6ww1"
          />
        </Button>
      </ButtonRow>
    </div>
  </div>
);

const StyledAlert = styled(Alert)`
  margin: 15px 0;
`;

const DefaultSuccessScreen = ({ onClose }) => (
  <div>
    <StyledAlert severity="success" data-testid="styledalert-nkjs">
      <TranslatedText
        stringId="paginatedForm.success.heading"
        fallback="Your response has been successfully submitted."
        data-testid="translatedtext-jbfk"
      />
    </StyledAlert>
    <ButtonRow data-testid="buttonrow-wjfv">
      <Button variant="contained" color="primary" onClick={onClose} data-testid="button-swbr">
        <TranslatedText
          stringId="general.action.ok"
          fallback="OK"
          data-testid="translatedtext-xxgi"
        />
      </Button>
    </ButtonRow>
  </div>
);

export const DefaultFormScreen = ({
  screenReactElement,
  allQuestionReactElements,
  values,
  onStepForward,
  onStepBack,
  isLast,
  screenIndex,
  customBottomRow,
}) => {
  const { children } = screenReactElement.props;
  const screenQuestionReactElements = React.Children.toArray(children);
  const visibleQuestions = getVisibleQuestions(
    values,
    allQuestionReactElements,
    screenQuestionReactElements,
  );
  const hasStepBack = screenIndex > 0;

  const updatedScreenReactElement = {
    ...screenReactElement,
    props: { ...screenReactElement.props, children: visibleQuestions },
  };

  return (
    <>
      {updatedScreenReactElement}
      {customBottomRow || (
        <Box mt={4} display="flex" justifyContent="space-between" data-testid="box-bdm6">
          <OutlinedButton
            onClick={hasStepBack ? onStepBack : undefined}
            disabled={!hasStepBack}
            data-testid="outlinedbutton-1z74"
          >
            <TranslatedText
              stringId="general.action.back"
              fallback="Back"
              data-testid="translatedtext-bdnx"
            />
          </OutlinedButton>
          <Button
            color="primary"
            variant="contained"
            onClick={onStepForward}
            data-testid="button-ysmw"
          >
            {isLast ? (
              <TranslatedText
                stringId="general.action.submit"
                fallback="Submit"
                data-testid="translatedtext-tt94"
              />
            ) : (
              <TranslatedText
                stringId="general.action.continue"
                fallback="Continue"
                data-testid="translatedtext-ybx9"
              />
            )}
          </Button>
        </Box>
      )}
    </>
  );
};

const FORM_STATES = {
  SUCCESS: 'success',
  IDLE: 'idle',
};

export const PaginatedForm = ({
  children,
  onSubmit,
  onCancel,
  FormScreen = DefaultFormScreen,
  SummaryScreen = DefaultSummaryScreen,
  SuccessScreen = DefaultSuccessScreen,
  validationSchema,
  initialValues,
  formType,
  formProps,
}) => {
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [showStepper, setShowStepper] = useState(true);
  const { onStepBack, onStepForward, handleStep, screenIndex } = usePaginatedForm();

  const onSubmitForm = async data => {
    await onSubmit(data);
    setFormState(FORM_STATES.SUCCESS);
  };

  if (formState === FORM_STATES.SUCCESS) {
    return <SuccessScreen onClose={onCancel} data-testid="successscreen-dbhr" />;
  }

  const formScreenReactElements = React.Children.toArray(children);
  const allQuestionReactElements = formScreenReactElements
    .map(s => React.Children.toArray(s.props.children))
    .flat();
  const maxIndex = formScreenReactElements.length - 1;
  const isLast = screenIndex === maxIndex;

  return (
    <Form
      onSubmit={onSubmitForm}
      validationSchema={validationSchema}
      initialValues={initialValues}
      formType={formType}
      render={({ submitForm, validateForm, values, setValues, setStatus }) => {
        if (screenIndex <= maxIndex) {
          const screenReactElement = formScreenReactElements.find((screen, i) =>
            i === screenIndex ? screen : null,
          );

          return (
            <>
              {showStepper && (
                <FormStepper
                  screenIndex={screenIndex}
                  handleStep={handleStep}
                  screenReactElements={formScreenReactElements}
                  data-testid="formstepper-xzaa"
                />
              )}
              <FormScreen
                screenReactElement={screenReactElement}
                allQuestionReactElements={allQuestionReactElements}
                values={values}
                setValues={setValues}
                submitForm={submitForm}
                onStepForward={onStepForward}
                isLast={isLast}
                onStepBack={onStepBack}
                screenIndex={screenIndex}
                setShowStepper={setShowStepper}
                onCancel={onCancel}
                validateForm={validateForm}
                setStatus={setStatus}
                data-testid="formscreen-89c8"
              />
            </>
          );
        }

        const submitVisibleValues = event => {
          const invisibleFields = new Set(
            getInvisibleQuestions(values, allQuestionReactElements).map(q => q.props.name),
          );
          const visibleValues = omit({ ...values }, invisibleFields);

          setValues(visibleValues);
          submitForm(event);
        };

        return (
          <SummaryScreen
            values={values}
            onStepBack={onStepBack}
            submitForm={submitVisibleValues}
            onCancel={onCancel}
            data-testid="summaryscreen-fypd"
          />
        );
      }}
      {...formProps}
      data-testid="form-jiq7"
    />
  );
};
