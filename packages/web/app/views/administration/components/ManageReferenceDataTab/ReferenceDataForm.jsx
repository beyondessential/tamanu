import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { startCase } from 'es-toolkit/compat';
import { FormGrid, Form } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  SAFE_CODE_REGEX,
  SAFE_CODE_ERROR_MESSAGE,
  SAFE_ID_REGEX,
  SAFE_ID_ERROR_MESSAGE,
} from '@tamanu/constants';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ModalFormActionRow } from '../../../../components/ModalActionRow';
import { FormSeparatorLine } from '../../../../components/FormSeparatorLine';
import { FormField } from './FormField';
import { isFieldRequired } from './constants';

const DetailHeading = styled.h3`
  grid-column: 1 / -1;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
`;

const CHARACTER_RULES = {
  code: { regex: SAFE_CODE_REGEX, message: SAFE_CODE_ERROR_MESSAGE },
  id: { regex: SAFE_ID_REGEX, message: SAFE_ID_ERROR_MESSAGE },
};

const buildValidationSchema = (columns, isEditMode, initialValues = {}) => {
  const shape = {};
  for (const col of columns) {
    if (col.readOnly) continue;
    if (isEditMode && col.readOnlyOnEdit) continue;
    if (isFieldRequired(col, { isEditMode })) {
      let fieldSchema = yup.string().required('Required');
      const rule = CHARACTER_RULES[col.key];
      if (rule) {
        // Match the importer's base id/code character rules, but only for a newly-entered value: a
        // record imported with a legacy code the importer never checked must stay editable.
        const initialValue = initialValues[col.key];
        fieldSchema = fieldSchema.test(
          'character-rule',
          rule.message,
          value => !value || value === initialValue || rule.regex.test(value),
        );
      }
      shape[col.key] = fieldSchema;
    }
  }
  return yup.object().shape(shape);
};

export const ReferenceDataForm = ({
  columns,
  onSubmit,
  onCancel,
  initialValues,
  isEditMode,
  selectedType,
}) => {
  const validationSchema = useMemo(
    () => buildValidationSchema(columns, isEditMode, initialValues),
    [columns, isEditMode, initialValues],
  );
  const renderForm = useCallback(
    ({ submitForm }) => {
      const visibleColumns = columns.filter(col => !col.readOnly);
      const firstDetailKey = visibleColumns.find(col => col.detail)?.key;

      return (
        <FormGrid data-testid="formgrid-refdata">
          {visibleColumns.map(col => (
            <React.Fragment key={col.key}>
              {col.key === firstDetailKey && (
                <>
                  <FormSeparatorLine data-testid="formseparatorline-refdata-detail" />
                  <DetailHeading data-testid="detailheading-refdata">
                    <TranslatedText
                      stringId="admin.referenceData.detailsHeading"
                      fallback=":type details"
                      replacements={{ type: startCase(selectedType) }}
                      data-testid="translatedtext-refdata-details-heading"
                    />
                  </DetailHeading>
                </>
              )}
              <FormField col={col} isEditMode={isEditMode} selectedType={selectedType} />
            </React.Fragment>
          ))}
          <ModalFormActionRow
            confirmText={
              <TranslatedText
                stringId={
                  isEditMode ? 'admin.referenceData.editSave' : 'admin.referenceData.addNew'
                }
                fallback={isEditMode ? 'Confirm' : 'Add Reference Data'}
                data-testid="translatedtext-confirm-refdata"
              />
            }
            onConfirm={submitForm}
            onCancel={onCancel}
            data-testid="modalformactionrow-refdata"
          />
        </FormGrid>
      );
    },
    [columns, isEditMode, onCancel, selectedType],
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
