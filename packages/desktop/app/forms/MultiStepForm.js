import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Button,
  ButtonRow,
  Form,
  FormGrid,
  FormSeparatorLine,
  OutlinedButton,
} from '../components';

const StyledBackButton = styled(OutlinedButton)`
  margin-right: auto;
  margin-left: 0 !important;
`;

// MultiStepForm is a single Formik instance whose children are each page of the
// multi-step form. The form is submitted on each forward transition (can only
// progress with valid input), whereas a backwards step is allowed with
// incomplete data. A snapshot of form state is used as initialValues after each
// transition. Each page has an optional submit handler, and the top-level
// submit is called when the final page is submitted.
export const MultiStepForm = ({
  children,
  initialValues,
  onSubmit,
  onCancel,
  onChangeStep,
  isSubmitting,
}) => {
  const [stepNumber, setStepNumber] = useState(0);
  const steps = React.Children.toArray(children);
  const [snapshot, setSnapshot] = useState(initialValues);

  const step = steps[stepNumber];
  const totalSteps = steps.length;
  const isLastStep = stepNumber === totalSteps - 1;

  const next = values => {
    setSnapshot(values);
    const nextStep = stepNumber + 1;
    if (onChangeStep) {
      onChangeStep(nextStep, values);
    }
    setStepNumber(Math.min(nextStep, totalSteps - 1));
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
      style={{ width: '100%' }}
      showInlineErrorsOnly
      render={props => {
        return (
          <FormGrid>
            {React.cloneElement(step, props)}
            <FormSeparatorLine />
            <ButtonRow>
              {stepNumber > 0 && (
                <StyledBackButton onClick={() => previous(props.values)}>Back</StyledBackButton>
              )}
              <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
              <Button isSubmitting={props.isSubmitting || isSubmitting} type="submit">
                {step.props.submitButtonText || 'Next'}
              </Button>
            </ButtonRow>
          </FormGrid>
        );
      }}
    />
  );
};

export const FormStep = ({ children, ...props }) => React.cloneElement(children, props);
