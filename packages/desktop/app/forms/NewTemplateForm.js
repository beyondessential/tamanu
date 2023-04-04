import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { Form, Field, TextField, MultilineTextField, SelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { TEMPLATE_TYPE_OPTIONS } from '../constants';

import { ConfirmCancelRow, ConfirmClearRow } from '../components/ButtonRow';
import { ButtonRow } from '../components/ButtonRow';

// From FormGrid -> row-gap
const SmallSpacer = styled.div`
  margin-bottom: 1.2rem;
`;

const TallMultilineTextField = props =>
  <MultilineTextField style={{ minHeight: '156px' }} {...props}/>

export const NewTemplateForm = memo(({ editedObject, onSubmit, onCancel }) => {
  const renderForm = ({ submitForm }) => (
    <>
      <FormGrid columns={2}>
        <Field name="type" label="Type" component={SelectField} options={TEMPLATE_TYPE_OPTIONS} required />
        <Field name="name" label="Template name" component={TextField} required />
      </FormGrid>
      <SmallSpacer />
      <FormGrid columns={1} nested>
        <Field name="title" label="Title" component={TextField} required />
        <Field name="contents" label="Contents" component={TallMultilineTextField}  required />
        {/* <ButtonRow>
          
          {/* confirmText="Create" onConfirm={submitForm} onCancel={onCancel} /> }
        </ButtonRow> */}
        {/* <ConfirmCancelRow onConfirm={submitForm} onCancel={onCancel} /> */}
        <ConfirmClearRow onConfirm={submitForm} onClear={onCancel} />
      </FormGrid>
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
        displayName: yup.string().required(),
        password: yup.string().required(),
        email: yup
          .string()
          .email()
          .required(),
      })}
    />
  );
});
