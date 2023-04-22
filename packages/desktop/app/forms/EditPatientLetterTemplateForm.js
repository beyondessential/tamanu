import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Form, Field, TextField, MultilineTextField } from '../components/Field';
import { FormGrid, SmallGridSpacer } from '../components/FormGrid';
import { Button, ButtonRow, BlankModalActionRow, RedOutlinedButton, OutlinedButton } from '../components';

const DeleteButton = styled(RedOutlinedButton)`
  margin-left: 0px !important;
`;

const Gap = styled.div`
  margin-left: auto !important;
`;

// TODO: RedOutlinedButton
const UneditedActions = ({ onClose, onDelete }) => (
  <BlankModalActionRow>
    <DeleteButton onClick={onDelete}>Delete template</DeleteButton>
    <Gap />
    <Button onClick={onClose}>Close</Button>
  </BlankModalActionRow>
);

const EditedActions = ({ onClose, onDelete, onSave }) => (
  <BlankModalActionRow>
    <DeleteButton onClick={onDelete}>Delete template</DeleteButton>
    <Gap />
    <OutlinedButton onClick={onClose}>Cancel</OutlinedButton>
    <Button onClick={onSave}>Save</Button>
  </BlankModalActionRow>
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
      <FormGrid columns={1} nested style={{marginBottom: "42px"}}>
        <Field name="body" label="Contents" component={TallMultilineTextField} />
      </FormGrid>
      {dirty ? <EditedActions onDelete={onDelete} onSave={submitForm} onClose={onClose}/> : <UneditedActions onDelete={onDelete} onClose={onClose}/>}
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
