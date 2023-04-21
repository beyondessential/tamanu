import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { TEMPLATE_TYPES } from 'shared/constants';

import { Form, Field, TextField, MultilineTextField, SelectField } from '../components/Field';
import { FormGrid, SmallGridSpacer } from '../components/FormGrid';
import { TEMPLATE_TYPE_OPTIONS } from '../constants';

import { ConfirmCancelRow, ConfirmClearRow } from '../components/ButtonRow';
import { ButtonRow } from '../components/ButtonRow';



const TallMultilineTextField = props =>
  <MultilineTextField style={{ minHeight: '156px' }} {...props}/>

export const EditPatientLetterTemplateForm = memo(({ onSubmit, existingTemplateNames, initialValues }) => {
  const renderForm = ({ submitForm, resetForm }) => (
    <>
      <FormGrid columns={2}>
        <Field name="name" label="Template name" component={TextField} required />
        <Field name="title" label="Title" component={TextField} />
      </FormGrid>
      <SmallGridSpacer />
      <FormGrid columns={1} nested>
        <Field name="body" label="Contents" component={TallMultilineTextField} />
      </FormGrid>
      <ConfirmClearRow onConfirm={submitForm} onClear={resetForm} />
    </>
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={initialValues}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
        title: yup.string(),
        body: yup.string(),
      })}
    />
  );
});
