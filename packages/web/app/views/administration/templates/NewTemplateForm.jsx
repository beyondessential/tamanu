import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Link } from '@material-ui/core';

import { Field, Form, TallMultilineTextField, TextField } from '../../../components/Field';
import { FormGrid, SmallGridSpacer } from '../../../components/FormGrid';
import { Colors, FORM_TYPES } from '../../../constants';

import { Button } from '../../../components/Button';
import { ButtonRow } from '../../../components/ButtonRow';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { TEMPLATE_TYPE_LABELS } from '@tamanu/constants';
import { TranslatedSelectField } from '../../../components/Translation/TranslatedSelect';

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
    <CenteredLink onClick={onClear}>
      <TranslatedText stringId="general.action.clear" fallback="Clear" />
    </CenteredLink>
    <ConfirmButton color="primary" onClick={onConfirm}>
      <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
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
            component={TranslatedSelectField}
            enumValues={TEMPLATE_TYPE_LABELS}
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
          <StyledField
            name="title"
            label={
              <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />
            }
            component={TextField}
            disabled={disabledTitle}
          />
          <Field
            name="body"
            label={<TranslatedText stringId="admin.template.content.label" fallback="Contents" />}
            component={TallMultilineTextField}
          />
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
