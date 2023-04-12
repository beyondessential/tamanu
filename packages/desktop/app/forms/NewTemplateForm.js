import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { TEMPLATE_TYPES } from 'shared/constants';

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

export const NewTemplateForm = memo(({ onSubmit }) => {
  const renderForm = ({ submitForm, resetForm }) => (
    <>
      <FormGrid columns={2}>
        <Field name="type" label="Type" component={SelectField} options={TEMPLATE_TYPE_OPTIONS} required />
        <Field name="name" label="Template name" component={TextField} required />
      </FormGrid>
      <SmallSpacer />
      <FormGrid columns={1} nested>
        <Field name="title" label="Title" component={TextField} required />
        <Field name="body" label="Contents" component={TallMultilineTextField}  required />
        <ConfirmClearRow onConfirm={submitForm} onClear={resetForm} />
      </FormGrid>
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{ type: TEMPLATE_TYPES.PATIENT_LETTER }}
      validationSchema={yup.object().shape({
        type: yup.string().required(),
        name: yup.string().required(),
        title: yup.string().required(),
        body: yup.string().required(),
      })}
    />
  );
});
