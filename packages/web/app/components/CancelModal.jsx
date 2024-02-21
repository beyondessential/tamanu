import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { FormModal } from './FormModal';
import { FormSubmitCancelRow } from './ButtonRow';
import { Field, Form, SelectField } from './Field';
import { BodyText } from './Typography';
import { FORM_TYPES } from '../constants';

const ModalBody = styled.div`
  margin-top: 30px;

  .MuiTypography-root {
    top: -10px;
    margin-bottom: 30px;
  }
`;

const Wrapper = styled.div`
  margin: 30px auto 50px;
  max-width: 350px;
`;
const isReasonForDelete = reason => reason === 'duplicate' || reason === 'entered-in-error';

export const CancelModal = React.memo(
  ({ title, bodyText, onConfirm, options, helperText, open, onClose }) => (
    <FormModal width="sm" title={title} onClose={onClose} open={open}>
      <Form
        onSubmit={onConfirm}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={yup.object().shape({
          reasonForCancellation: yup.string().required(),
        })}
        render={({ values, submitForm }) => (
          <ModalBody>
            <BodyText>{bodyText}</BodyText>
            <Wrapper>
              <Field
                required
                component={SelectField}
                label="Reason for cancellation"
                name="reasonForCancellation"
                options={options}
                helperText={isReasonForDelete(values.reasonForCancellation) ? helperText : null}
              />
            </Wrapper>
            <FormSubmitCancelRow onCancel={onClose} onConfirm={submitForm} cancelText="Close" />
          </ModalBody>
        )}
      />
    </FormModal>
  ),
);
