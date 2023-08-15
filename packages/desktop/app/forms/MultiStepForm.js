import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Button,
  ButtonRow,
  ConfirmCancelRow,
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
    const nextStep = Math.min(stepNumber + 1, totalSteps - 1);
    if (onChangeStep) {
      onChangeStep(nextStep, values);
    }
    setStepNumber(nextStep);
  };

  const previous = values => {
    const prevStep = Math.max(stepNumber - 1, 0);
    if (onChangeStep) {
      onChangeStep(prevStep, values);
    }
    setStepNumber(prevStep);
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
              <ConfirmCancelRow
                confirmText={step.props.submitButtonText || 'Next'}
                onCancel={onCancel}
                onConfirm={() => true}
              />
            </ButtonRow>
          </FormGrid>
        );
      }}
    />
  );
};

export const FormStep = ({ children, ...props }) => React.cloneElement(children, props);
