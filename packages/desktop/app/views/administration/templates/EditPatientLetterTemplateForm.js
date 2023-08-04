import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Form, Field, TextField, TallMultilineTextField } from '../../../components/Field';
import { FormGrid, SmallGridSpacer } from '../../../components/FormGrid';
import {
  Button,
  ModalGenericButtonRow,
  RedOutlinedButton,
  OutlinedButton,
} from '../../../components';

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

export const EditPatientLetterTemplateForm = memo(
  ({ onSubmit, editedObject, onDelete, onClose }) => {
    const renderForm = ({ submitForm, dirty }) => (
      <>
        <FormGrid columns={2}>
          <Field name="name" label="Template name" component={TextField} required />
          <Field name="title" label="Title" component={TextField} />
        </FormGrid>
        <SmallGridSpacer />
        <FormGrid columns={1} nested style={{ marginBottom: '42px' }}>
          <Field name="body" label="Contents" component={TallMultilineTextField} />
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
        initialValues={editedObject}
        validationSchema={yup.object().shape({
          name: yup.string().required(),
          title: yup.string(),
          body: yup.string(),
        })}
      />
    );
  },
);
