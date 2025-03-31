import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Field, Form, TallMultilineTextField, TextField } from '../../../components/Field';
import { FormGrid, SmallGridSpacer } from '../../../components/FormGrid';
import {
  Button,
  ModalGenericButtonRow,
  OutlinedButton,
  RedOutlinedButton,
} from '../../../components';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const DeleteButton = styled(RedOutlinedButton)`
  margin-left: 0px !important;
`;

const Gap = styled.div`
  margin-left: auto !important;
`;

const UneditedActions = ({ onClose, onDelete }) => (
  <ModalGenericButtonRow>
    <DeleteButton onClick={onDelete} data-test-id='deletebutton-yfzv'>Delete template</DeleteButton>
    <Gap />
    <Button onClick={onClose} data-test-id='button-4ibs'>Close</Button>
  </ModalGenericButtonRow>
);

const EditedActions = ({ onClose, onDelete, onSave }) => (
  <ModalGenericButtonRow>
    <DeleteButton onClick={onDelete} data-test-id='deletebutton-upk3'>Delete template</DeleteButton>
    <Gap />
    <OutlinedButton onClick={onClose} data-test-id='outlinedbutton-fk3u'>Cancel</OutlinedButton>
    <Button onClick={onSave} data-test-id='button-gzip'>Save</Button>
  </ModalGenericButtonRow>
);

export const EditTemplateForm = memo(
  ({ onSubmit, editedObject, onDelete, onClose, allowInputTitleType }) => {
    const renderForm = ({ submitForm, dirty, values }) => (
      <>
        <FormGrid columns={2}>
          <Field
            name="name"
            label={
              <TranslatedText
                stringId="patientLetterTemplate.templateName.label"
                fallback="Template name"
                data-test-id='translatedtext-8haw' />
            }
            component={TextField}
            required
            data-test-id='field-6o9x' />
          <Field
            name="title"
            label={
              <TranslatedText
                stringId="general.localisedField.title.label"
                fallback="Title"
                data-test-id='translatedtext-8fta' />
            }
            component={TextField}
            disabled={!allowInputTitleType.includes(values.type)}
            data-test-id='field-kam1' />
        </FormGrid>
        <SmallGridSpacer />
        <FormGrid columns={1} nested style={{ marginBottom: '42px' }}>
          <Field
            name="body"
            label={<TranslatedText
              stringId="admin.template.content.label"
              fallback="Contents"
              data-test-id='translatedtext-mjgy' />}
            component={TallMultilineTextField}
            data-test-id='field-bmhh' />
        </FormGrid>
        {dirty ? (
          <EditedActions onDelete={onDelete} onSave={submitForm} onClose={onClose} />
        ) : (
          <UneditedActions onDelete={onDelete} onClose={onClose} />
        )}
      </>
    );

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={editedObject}
        validationSchema={yup.object().shape({
          name: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="patientLetterTemplate.templateName.label"
                fallback="Template name"
                data-test-id='translatedtext-jwaj' />,
            ),
          title: yup.string(),
          body: yup.string(),
        })}
      />
    );
  },
);
