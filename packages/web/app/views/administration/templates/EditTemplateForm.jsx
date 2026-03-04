import React, { memo } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import {
  TextField,
  TallMultilineTextField,
  Form,
  Button,
  OutlinedButton,
  FormGrid,
  SmallGridSpacer,
  RedOutlinedButton,
} from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';

import { Field } from '../../../components/Field';
import { ModalGenericButtonRow } from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const DeleteButton = styled(RedOutlinedButton)`
  margin-left: 0px !important;
`;

const Gap = styled.div`
  margin-left: auto !important;
`;

const UneditedActions = ({ onClose, onDelete }) => (
  <ModalGenericButtonRow data-testid="modalgenericbuttonrow-wtwk">
    <DeleteButton onClick={onDelete} data-testid="deletebutton-wijz">
      Delete template
    </DeleteButton>
    <Gap data-testid="gap-4ju1" />
    <Button onClick={onClose} data-testid="button-9i89">
      Close
    </Button>
  </ModalGenericButtonRow>
);

const EditedActions = ({ onClose, onDelete, onSave }) => (
  <ModalGenericButtonRow data-testid="modalgenericbuttonrow-946p">
    <DeleteButton onClick={onDelete} data-testid="deletebutton-bd75">
      Delete template
    </DeleteButton>
    <Gap data-testid="gap-0nns" />
    <OutlinedButton onClick={onClose} data-testid="outlinedbutton-j2h3">
      Cancel
    </OutlinedButton>
    <Button onClick={onSave} data-testid="button-g2un">
      Save
    </Button>
  </ModalGenericButtonRow>
);

export const EditTemplateForm = memo(
  ({ onSubmit, editedObject, onDelete, onClose, allowInputTitleType }) => {
    const renderForm = ({ submitForm, dirty, values }) => (
      <>
        <FormGrid columns={2} data-testid="formgrid-1pcw">
          <Field
            name="name"
            label={
              <TranslatedText
                stringId="patientLetterTemplate.templateName.label"
                fallback="Template name"
                data-testid="translatedtext-my1a"
              />
            }
            component={TextField}
            required
            data-testid="field-dpsu"
          />
          <Field
            name="title"
            label={
              <TranslatedText
                stringId="general.localisedField.title.label"
                fallback="Title"
                data-testid="translatedtext-drlt"
              />
            }
            component={TextField}
            disabled={!allowInputTitleType.includes(values.type)}
            data-testid="field-8a47"
          />
        </FormGrid>
        <SmallGridSpacer data-testid="smallgridspacer-7w05" />
        <FormGrid columns={1} nested style={{ marginBottom: '42px' }} data-testid="formgrid-b2ge">
          <Field
            name="body"
            label={
              <TranslatedText
                stringId="admin.template.content.label"
                fallback="Contents"
                data-testid="translatedtext-cj4v"
              />
            }
            component={TallMultilineTextField}
            data-testid="field-g5t4"
          />
        </FormGrid>
        {dirty ? (
          <EditedActions
            onDelete={onDelete}
            onSave={submitForm}
            onClose={onClose}
            data-testid="editedactions-5ior"
          />
        ) : (
          <UneditedActions
            onDelete={onDelete}
            onClose={onClose}
            data-testid="uneditedactions-wyml"
          />
        )}
      </>
    );

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={editedObject}
        validationSchema={yup.object().shape({
          name: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="patientLetterTemplate.templateName.label"
                fallback="Template name"
                data-testid="translatedtext-64ya"
              />,
            ),
          title: yup.string(),
          body: yup.string(),
        })}
        data-testid="form-pvft"
      />
    );
  },
);
