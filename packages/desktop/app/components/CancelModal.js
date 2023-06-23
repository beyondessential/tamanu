import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectField, Form, Field } from './Field';
import { BodyText } from './Typography';

const ModalBody = styled.div`
  margin-top: 30px;

  .MuiTypography-root {
    top: -10px;
    margin-bottom: 30px;
  }
`;

const Wrapper = styled.div`
  margin: 0 auto 50px;
  max-width: 350px;
`;
const isReasonForDelete = reason => reason === 'duplicate' || reason === 'entered-in-error';

export const CancelModal = React.memo(
  ({ title, bodyText, onConfirm, options, helperText, open, onClose }) => (
    <Modal width="sm" title={title} onClose={onClose} open={open}>
      <Form
        onSubmit={onConfirm}
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
            <ConfirmCancelRow onCancel={onClose} onConfirm={submitForm} cancelText="Close" />
          </ModalBody>
        )}
      />
    </Modal>
  ),
);
