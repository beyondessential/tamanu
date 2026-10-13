import React from 'react';
import styled from 'styled-components';

import { ErrorMessage, KioskInput, KioskSelect, scaled } from '../../kioskStyles';

const QuestionText = styled.div`
  display: block;
  margin-bottom: ${scaled(16)};
  font-size: ${scaled(20)};
  font-weight: 500;
  line-height: 1.35;
  color: var(--kiosk-text);
`;

export const Hint = styled.div`
  margin: ${scaled(-8)} 0 ${scaled(14)};
  font-size: ${scaled(15)};
  color: var(--kiosk-text-tertiary);
`;

export const RequiredMark = styled.span`
  color: var(--kiosk-alert);
  font-weight: 500;
`;

export const QuestionInput = styled(KioskInput)`
  min-height: ${scaled(60)};
  padding: 0 ${scaled(20)};
  font-size: ${scaled(20)};
`;

/** For short answers like numbers, where a full-width box would suggest a long one. */
export const NarrowQuestionInput = styled(QuestionInput)`
  width: ${scaled(180)};
`;

export const QuestionSelect = styled(KioskSelect)`
  min-height: ${scaled(60)};
  font-size: ${scaled(20)};
`;

/** Outlines a group of option buttons when the question has a validation error. */
export const ErrorOutline = styled.div`
  border-radius: 14px;

  &[data-invalid='true'] {
    box-shadow: 0 0 0 2px var(--kiosk-alert);
  }
`;

/**
 * The question text, hint and validation message around a kiosk control. Errors only show once
 * the patient has tried to move on (the shared `Field` passes the message as `helperText` then).
 */
export const Question = ({ label, required, helperText, error, inputId, children, hint }) => (
  <>
    <QuestionText as={inputId ? 'label' : 'div'} htmlFor={inputId}>
      {label}
      {required && <RequiredMark aria-hidden="true"> *</RequiredMark>}
    </QuestionText>
    {(hint || (!error && helperText)) && <Hint>{hint ?? helperText}</Hint>}
    {children}
    {error && helperText && <ErrorMessage role="alert">{helperText}</ErrorMessage>}
  </>
);

/** Sets a question's answer the way the shared fields do, through Formik's change handler. */
export const setFieldValue = (field, value) =>
  field.onChange({ target: { name: field.name, value } });
