import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Link } from '@material-ui/core';
import {
  Field,
  TallMultilineTextField,
  TextField,
  TranslatedSelectField,
  Form,
  Button,
  FormGrid,
  ButtonRow,
  SmallGridSpacer,
  TranslatedText,
} from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { TEMPLATE_TYPE_LABELS } from '@tamanu/constants';
import { Colors } from '../../../constants';

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
  <ButtonRow data-testid="buttonrow-28tq">
    <CenteredLink onClick={onClear} data-testid="centeredlink-2t4o">
      <TranslatedText
        stringId="general.action.clear"
        fallback="Clear"
        data-testid="translatedtext-wsdn"
      />
    </CenteredLink>
    <ConfirmButton color="primary" onClick={onConfirm} data-testid="confirmbutton-f4r3">
      <TranslatedText
        stringId="general.action.confirm"
        fallback="Confirm"
        data-testid="translatedtext-mn0b"
      />
    </ConfirmButton>
  </ButtonRow>
));

export const NewTemplateForm = memo(({ onSubmit, allowInputTitleType }) => {
  const renderForm = ({ submitForm, resetForm, values }) => {
    const disabledTitle = !values?.type || !allowInputTitleType.includes(values?.type);

    return (
      <>
        <FormGrid columns={2} data-testid="formgrid-g4zl">
          <Field
            name="type"
            label={
              <TranslatedText
                stringId="general.type.label"
                fallback="Type"
                data-testid="translatedtext-aajp"
              />
            }
            component={TranslatedSelectField}
            enumValues={TEMPLATE_TYPE_LABELS}
            required
            onChange={() => resetForm({ values: {} })}
            data-testid="field-c9h8"
          />
          <Field
            name="name"
            label={
              <TranslatedText
                stringId="patientLetterTemplate.templateName.label"
                fallback="Template name"
                data-testid="translatedtext-dn5r"
              />
            }
            component={TextField}
            required
            data-testid="field-9vo0"
          />
        </FormGrid>
        <SmallGridSpacer data-testid="smallgridspacer-eo6v" />
        <FormGrid columns={1} nested data-testid="formgrid-hze3">
          <StyledField
            name="title"
            label={
              <TranslatedText
                stringId="general.localisedField.title.label"
                fallback="Title"
                data-testid="translatedtext-ab1d"
              />
            }
            component={TextField}
            disabled={disabledTitle}
            data-testid="styledfield-bw43"
          />
          <Field
            name="body"
            label={
              <TranslatedText
                stringId="admin.template.content.label"
                fallback="Contents"
                data-testid="translatedtext-kz5f"
              />
            }
            component={TallMultilineTextField}
            data-testid="field-znq6"
          />
        </FormGrid>
        <ConfirmClearRow
          onConfirm={submitForm}
          onClear={resetForm}
          data-testid="confirmclearrow-kixd"
        />
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
          .translatedLabel(
            <TranslatedText
              stringId="general.type.label"
              fallback="Type"
              data-testid="translatedtext-2lpr"
            />,
          ),
        name: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="patientLetterTemplate.templateName.label"
              fallback="Template name"
              data-testid="translatedtext-7pbt"
            />,
          ),
        title: yup.string(),
        body: yup.string(),
      })}
      data-testid="form-kfhg"
    />
  );
});
