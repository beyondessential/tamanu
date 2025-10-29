import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { SelectField, Form, FormSubmitCancelRow, TranslatedText } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants';
import { FormModal } from './FormModal';
import { Field } from './Field';
import { BodyText } from './Typography';

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
const isReasonForDelete = (reason) => reason === 'duplicate' || reason === 'entered-in-error';

export const CancelModal = React.memo(
  ({ title, bodyText, onConfirm, options, helperText, open, onClose }) => (
    <FormModal width="sm" title={title} onClose={onClose} open={open} data-testid="formmodal-e62m">
      <Form
        onSubmit={onConfirm}
        formType={FORM_TYPES.EDIT_FORM}
        validationSchema={yup.object().shape({
          reasonForCancellation: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="imaging.modal.cancel.reason.label"
                fallback="Reason for cancellation"
                data-testid="translatedtext-4y3x"
              />,
            ),
        })}
        render={({ values, submitForm }) => (
          <ModalBody data-testid="modalbody-7zg4">
            <BodyText data-testid="bodytext-ej4m">{bodyText}</BodyText>
            <Wrapper data-testid="wrapper-w9e9">
              <Field
                required
                component={SelectField}
                label={
                  <TranslatedText
                    stringId="imaging.modal.cancel.reason.label"
                    fallback="Reason for cancellation"
                    data-testid="translatedtext-9dls"
                  />
                }
                name="reasonForCancellation"
                options={options}
                helperText={isReasonForDelete(values.reasonForCancellation) ? helperText : null}
                prefix="imaging.cancel.property.reason"
                data-testid="field-c7rc"
              />
            </Wrapper>
            <FormSubmitCancelRow
              onCancel={onClose}
              onConfirm={submitForm}
              cancelText={
                <TranslatedText
                  stringId="general.action.close"
                  fallback="Close"
                  data-testid="translatedtext-48uh"
                />
              }
              data-testid="formsubmitcancelrow-1ync"
            />
          </ModalBody>
        )}
        data-testid="form-6kqu"
      />
    </FormModal>
  ),
);
