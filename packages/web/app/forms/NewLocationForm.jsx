import React, { memo, useCallback } from 'react';
import * as yup from 'yup';

import { TextField, Form, FormGrid } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Field } from '../components/Field';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const NewLocationForm = memo(({ editedObject, onSubmit, onCancel }) => {
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid data-testid="formgrid-9jpn">
        <Field
          name="name"
          label={
            <TranslatedText
              string="general.locationName.label"
              fallback="Location name"
              data-testid="translatedtext-wlyu"
            />
          }
          component={TextField}
          required
          data-testid="field-six5"
        />
        <ModalFormActionRow
          confirmText="Create"
          onConfirm={submitForm}
          onCancel={onCancel}
          data-testid="modalformactionrow-n1ko"
        />
      </FormGrid>
    ),
    [onCancel],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      formType={editedObject ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        name: yup
          .string()
          .required(
            <TranslatedText
              string="general.locationName.label"
              fallback="Location name"
              data-testid="translatedtext-1fju"
            />,
          ),
      })}
      data-testid="form-n05j"
    />
  );
});
