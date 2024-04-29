import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Link } from '@material-ui/core';

import {
  Field,
  Form,
  SelectField,
  TallMultilineTextField,
  TextField,
} from '../../../components/Field';
import { FormGrid, SmallGridSpacer } from '../../../components/FormGrid';
import { Colors, FORM_TYPES, TEMPLATE_TYPE_OPTIONS } from '../../../constants';

import { Button } from '../../../components/Button';
import { ButtonRow } from '../../../components/ButtonRow';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const ConfirmButton = styled(Button)`
  min-width: 90px;
`;

const CenteredLink = styled(Link)`
  align-self: center;
`;

const StyledField = styled(Field)`
  .MuiFormControl-root {
    background: ${props => (props.disabled ? Colors.outline : 'inherit')};
  }
`;

const ConfirmClearRow = React.memo(({ onClear, onConfirm }) => (
  <ButtonRow>
    <CenteredLink onClick={onClear}>Clear</CenteredLink>
    <ConfirmButton color="primary" onClick={onConfirm}>
      Confirm
    </ConfirmButton>
  </ButtonRow>
));

export const NewTemplateForm = memo(({ onSubmit, allowInputTitleType }) => {
  const renderForm = ({ submitForm, resetForm, values }) => {
    const disabledTitle = !values?.type || !allowInputTitleType.includes(values?.type);

    return (
      <>
        <FormGrid columns={2}>
          <Field
            name="type"
            label={<TranslatedText stringId="general.type.label" fallback="Type" />}
            component={SelectField}
            options={TEMPLATE_TYPE_OPTIONS}
            required
            prefix="template.property.type"
            onChange={() => resetForm({ values: {} })}
          />
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
        </FormGrid>
        <SmallGridSpacer />
        <FormGrid columns={1} nested>
          <StyledField name="title" label="Title" component={TextField} disabled={disabledTitle} />
          <Field name="body" label="Contents" component={TallMultilineTextField} />
        </FormGrid>
        <ConfirmClearRow onConfirm={submitForm} onClear={resetForm} />
      </>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      formType={FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        type: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="general.type.label" fallback="Type" />),
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
});
