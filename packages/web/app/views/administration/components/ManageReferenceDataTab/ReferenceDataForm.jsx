import React, { useCallback, useMemo } from 'react';
import * as yup from 'yup';
import { FormGrid, Form } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ModalFormActionRow } from '../../../../components/ModalActionRow';
import { FormField } from './FormField';
import { REQUIRED_FIELDS } from './constants';

const buildValidationSchema = (columns, isEditMode) => {
  const shape = {};
  for (const col of columns) {
    if (col.readOnly) continue;
    if (isEditMode && col.readOnlyOnEdit) continue;
    if (REQUIRED_FIELDS.has(col.key) || (!col.allowNull && !col.hasDefault)) {
      shape[col.key] = yup.string().required('Required');
    }
  }
  return yup.object().shape(shape);
};

export const ReferenceDataForm = ({ columns, onSubmit, onCancel, initialValues, isEditMode }) => {
  const validationSchema = useMemo(() => buildValidationSchema(columns, isEditMode), [columns, isEditMode]);
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid data-testid="formgrid-refdata">
        {columns
          .filter(col => !col.readOnly)
          .map(col => (
            <FormField key={col.key} col={col} isEditMode={isEditMode} />
          ))}
        <ModalFormActionRow
          confirmText={
            <TranslatedText
              stringId={isEditMode ? 'admin.referenceData.editSave' : 'admin.referenceData.addNew'}
              fallback={isEditMode ? 'Confirm' : 'Add Reference Data'}
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
      validationSchema={validationSchema}
      formType={isEditMode ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      initialValues={initialValues}
      enableReinitialize
      data-testid="form-refdata"
    />
  );
};
