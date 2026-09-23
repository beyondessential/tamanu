import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { startCase } from 'es-toolkit/compat';
import { FormGrid, Form } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { TranslatedText } from '../../../../components/Translation/TranslatedText';
import { ModalFormActionRow } from '../../../../components/ModalActionRow';
import { FormSeparatorLine } from '../../../../components/FormSeparatorLine';
import { FormField } from './FormField';
import { REQUIRED_FIELDS } from './constants';

const DetailHeading = styled.h3`
  grid-column: 1 / -1;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
`;

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

export const ReferenceDataForm = ({
  columns,
  onSubmit,
  onCancel,
  initialValues,
  isEditMode,
  selectedType,
}) => {
  const validationSchema = useMemo(() => buildValidationSchema(columns, isEditMode), [columns, isEditMode]);
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
            <FormField col={col} isEditMode={isEditMode} />
          </React.Fragment>
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
