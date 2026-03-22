import React, { memo, useCallback } from 'react';
import { FormGrid, Form } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ModalFormActionRow } from '../../../../components/ModalActionRow';
import { FormField } from './FormField';

export const ReferenceDataForm = memo(
  ({ columns, onSubmit, onCancel, initialValues, isEditMode }) => {
    const renderForm = useCallback(
      ({ submitForm }) => (
        <FormGrid data-testid="formgrid-refdata">
          {columns.map(col => (
            <FormField key={col.key} col={col} isEditMode={isEditMode} />
          ))}
          <ModalFormActionRow
            confirmText={
              <TranslatedText
                stringId={isEditMode ? 'general.action.save' : 'general.action.create'}
                fallback={isEditMode ? 'Save' : 'Create'}
                data-testid="translatedtext-confirm-refdata"
              />
            }
            onConfirm={submitForm}
            onCancel={onCancel}
            data-testid="modalformactionrow-refdata"
          />
        </FormGrid>
      ),
      [columns, isEditMode, onCancel],
    );

    return (
      <Form
        onSubmit={onSubmit}
        render={renderForm}
        formType={isEditMode ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        initialValues={initialValues}
        enableReinitialize
        data-testid="form-refdata"
      />
    );
  },
);
