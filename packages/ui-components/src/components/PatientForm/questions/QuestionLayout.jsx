import React from 'react';
import styled from 'styled-components';

import { formScaled, FormErrorMessage, FormInput } from '../styles';

const QuestionText = styled.div`
  display: block;
  margin-bottom: ${formScaled(16)};
  font-size: ${formScaled(20)};
  font-weight: 500;
  line-height: 1.35;
  color: var(--pf-text);
`;

export const Hint = styled.div`
  margin: ${formScaled(-8)} 0 ${formScaled(14)};
  font-size: ${formScaled(15)};
  color: var(--pf-text-tertiary);
`;

export const RequiredMark = styled.span`
  color: var(--pf-alert);
  font-weight: 500;
`;

/** For short answers like numbers, where a full-width box would suggest a long one. */
export const NarrowFormInput = styled(FormInput)`
  width: ${formScaled(180)};
`;

/** Outlines a group of option buttons when the question has a validation error. */
export const ErrorOutline = styled.div`
  border-radius: var(--pf-radius, 14px);

  &[data-invalid='true'] {
    box-shadow: 0 0 0 2px var(--pf-alert);
  }
`;

/**
 * The question text, hint and validation message around a control. Errors only show once the
 * patient has tried to move on (the shared `Field` passes the message as `helperText` then).
 */
export const Question = ({ label, required, helperText, error, inputId, children, hint }) => (
  <>
    <QuestionText as={inputId ? 'label' : 'div'} htmlFor={inputId}>
      {label}
      {required && <RequiredMark aria-hidden="true"> *</RequiredMark>}
    </QuestionText>
    {(hint || (!error && helperText)) && <Hint>{hint ?? helperText}</Hint>}
    {children}
    {error && helperText && <FormErrorMessage role="alert">{helperText}</FormErrorMessage>}
  </>
);

/** Sets a question's answer the way the shared fields do, through Formik's change handler. */
export const setFieldValue = (field, value) =>
  field.onChange({ target: { name: field.name, value } });
