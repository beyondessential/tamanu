import React, { useState } from 'react';
import { Button, ButtonRow, Form, FormGrid, OutlinedButton } from '../components';
import { FormSeparatorLine } from '../components/FormSeparatorLine';

// Wizard is a single Formik instance whose children are each page of the
// multi-step form. The form is submitted on each forward transition (can only
// progress with valid input), whereas a backwards step is allowed with
// incomplete data. A snapshot of form state is used as initialValues after each
// transition. Each page has an optional submit handler, and the top-level
// submit is called when the final page is submitted.
export const Wizard = ({ children, initialValues, onSubmit, onCancel }) => {
  const [stepNumber, setStepNumber] = useState(0);
  const steps = React.Children.toArray(children);
  const [snapshot, setSnapshot] = useState(initialValues);

  const step = steps[stepNumber];
  const totalSteps = steps.length;
  const isLastStep = stepNumber === totalSteps - 1;

  const next = values => {
    setSnapshot(values);
    setStepNumber(Math.min(stepNumber + 1, totalSteps - 1));
  };

  const previous = values => {
    setSnapshot(values);
    setStepNumber(Math.max(stepNumber - 1, 0));
  };

  const handleSubmit = async (values, bag) => {
    if (step.props.onSubmit) {
      await step.props.onSubmit(values, bag);
    }
    if (isLastStep) {
      return onSubmit(values, bag);
    }
    bag.setTouched({});
    return next(values);
  };

  return (
    <Form
      initialValues={snapshot}
      onSubmit={handleSubmit}
      validationSchema={step.props.validationSchema}
      showInlineErrorsOnly
      render={props => {
        return (
          <FormGrid>
            {React.cloneElement(step, props)}
            <FormSeparatorLine />
            <ButtonRow>
              {stepNumber > 0 ? (
                <OutlinedButton onClick={() => previous(props.values)}>Back</OutlinedButton>
              ) : (
                <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
              )}
              <Button disabled={props.isSubmitting} type="submit">
                {isLastStep ? 'Submit' : 'Next'}
              </Button>
            </ButtonRow>
          </FormGrid>
        );
      }}
    />
  );
};

export const WizardStep = ({ children, ...props }) => React.cloneElement(children, props);
