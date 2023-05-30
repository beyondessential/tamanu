import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectField, Form, Field } from './Field';

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

export const EditVitalCellModal = ({ value, onConfirm, onClose, open }) => (
  <Modal width="sm" title={value} onClose={onClose} open={open}>
    <Form
      onSubmit={onConfirm}
      validationSchema={yup.object().shape({
        reasonForCancellation: yup.string().required('Reason for cancellation is mandatory'),
      })}
      render={({
        // value: formValue,
        submitForm,
      }) => (
        <ModalBody>
          <Wrapper>
            <Field
              required
              component={SelectField}
              label="Reason for cancellation"
              name="reasonForCancellation"
              // options={options}
            />
          </Wrapper>
          <ConfirmCancelRow onCancel={onClose} onConfirm={submitForm} confirmText="Save" />
        </ModalBody>
      )}
    />
  </Modal>
);
