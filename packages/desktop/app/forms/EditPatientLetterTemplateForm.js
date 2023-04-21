import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Form, Field, TextField, MultilineTextField, SelectField } from '../components/Field';
import { FormGrid, SmallGridSpacer } from '../components/FormGrid';
import { TEMPLATE_TYPE_OPTIONS } from '../constants';
import { Button, BlankActionRow, OutlinedDeleteButton, OutlinedButton } from '../components';

import { ConfirmCancelRow, ConfirmClearRow } from '../components/ButtonRow';
import { ButtonRow } from '../components/ButtonRow';

const Gap = styled.div`
  margin-left: auto;
`;

const UneditedActions = ({ onClose, onDelete }) => (
  <BlankActionRow>
    <OutlinedDeleteButton onClick={onDelete}>Delete</OutlinedDeleteButton>
    <Gap />
    <Button onClick={onClose}>Close</Button>
  </BlankActionRow>
);

const EditedActions = ({ onClose, onDelete, onSave }) => (
  <BlankActionRow>
    <OutlinedDeleteButton onClick={onDelete}>Delete</OutlinedDeleteButton>
    <Gap />
    <OutlinedButton onClick={onClose}>Cancel</OutlinedButton>
    <Button onClick={onSave}>Save</Button>
  </BlankActionRow>
);


const TallMultilineTextField = props =>
  <MultilineTextField style={{ minHeight: '156px' }} {...props}/>

export const EditPatientLetterTemplateForm = memo(({ onSubmit, editedObject, onDelete, onClose }) => {
  const renderForm = ({ submitForm, dirty }) => (
    <>
      <FormGrid columns={2}>
        <Field name="name" label="Template name" component={TextField} required />
        <Field name="title" label="Title" component={TextField} />
      </FormGrid>
      <SmallGridSpacer />
      <FormGrid columns={1} nested>
        <Field name="body" label="Contents" component={TallMultilineTextField} />
      </FormGrid>
      {dirty ? <EditedActions onDelete={onDelete} onClose={onClose}/> : <UneditedActions onDelete={onDelete} onSave={submitForm} onClose={onClose}/>}
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
        title: yup.string(),
        body: yup.string(),
      })}
    />
  );
});
