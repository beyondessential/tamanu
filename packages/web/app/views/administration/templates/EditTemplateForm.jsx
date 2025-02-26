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
    <DeleteButton onClick={onDelete}>Delete template</DeleteButton>
    <Gap />
    <Button onClick={onClose}>Close</Button>
  </ModalGenericButtonRow>
);

const EditedActions = ({ onClose, onDelete, onSave }) => (
  <ModalGenericButtonRow>
    <DeleteButton onClick={onDelete}>Delete template</DeleteButton>
    <Gap />
    <OutlinedButton onClick={onClose}>Cancel</OutlinedButton>
    <Button onClick={onSave}>Save</Button>
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
              />
            }
            component={TextField}
            required
          />
          <Field
            name="title"
            label={
              <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />
            }
            component={TextField}
            disabled={!allowInputTitleType.includes(values.type)}
          />
        </FormGrid>
        <SmallGridSpacer />
        <FormGrid columns={1} nested style={{ marginBottom: '42px' }}>
          <Field
            name="body"
            label={<TranslatedText stringId="admin.template.content.label" fallback="Contents" />}
            component={TallMultilineTextField}
          />
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
              />,
            ),
          title: yup.string(),
          body: yup.string(),
        })}
      />
    );
  },
);
