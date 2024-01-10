import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Link } from '@material-ui/core';

import { TEMPLATE_TYPES } from '@tamanu/constants';

import {
  Form,
  Field,
  TextField,
  TallMultilineTextField,
  SelectField,
} from '../../../components/Field';
import { FormGrid, SmallGridSpacer } from '../../../components/FormGrid';
import { TEMPLATE_TYPE_OPTIONS } from '../../../constants';

import { Button } from '../../../components/Button';
import { ButtonRow } from '../../../components/ButtonRow';

const ConfirmButton = styled(Button)`
  min-width: 90px;
`;

const CenteredLink = styled(Link)`
  align-self: center;
`;

const ConfirmClearRow = React.memo(({ onClear, onConfirm }) => (
  <ButtonRow>
    <CenteredLink onClick={onClear}>Clear</CenteredLink>
    <ConfirmButton color="primary" onClick={onConfirm}>
      Confirm
    </ConfirmButton>
  </ButtonRow>
));

export const NewTemplateForm = memo(({ onSubmit }) => {
  const renderForm = ({ submitForm, resetForm }) => (
    <>
      <FormGrid columns={2}>
        <Field
          name="type"
          label="Type"
          component={SelectField}
          options={TEMPLATE_TYPE_OPTIONS}
          required
        />
        <Field name="name" label="Template name" component={TextField} required />
      </FormGrid>
      <SmallGridSpacer />
      <FormGrid columns={1} nested>
        <Field name="title" label="Title" component={TextField} />
        <Field name="body" label="Contents" component={TallMultilineTextField} />
      </FormGrid>
      <ConfirmClearRow onConfirm={submitForm} onClear={resetForm} />
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
        title: yup.string(),
        body: yup.string(),
      })}
    />
  );
});
