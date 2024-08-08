import React, { memo, useCallback, useEffect, useState } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../../api';
import { Field, Form } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { Button, FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useFormikContext } from 'formik';

const ExportForm = ({
  dataTypes,
  dataTypesSelectable,
  dataReadyForSaving,
  onDownload,
  resetDownload,
}) => {
  const { values } = useFormikContext();

  useEffect(() => {
    resetDownload();
  }, [values.includedDataTypes, resetDownload]);

  return (
    <FormGrid columns={1}>
      {dataTypesSelectable && (
        <Field
          name="includedDataTypes"
          label={
            <TranslatedText
              stringId="admin.export.includedDataTypes.label"
              fallback="Select data types to export"
            />
          }
          component={ExpandedMultiSelectField}
          options={dataTypes.map(value => ({ value, label: startCase(value) }))}
        />
      )}
      <ButtonRow>
        {dataReadyForSaving ? (
          <Button onClick={onDownload}>
            <TranslatedText stringId="general.action.download" fallback="Download" /> (
            {(dataReadyForSaving?.size / 1000000).toFixed(1)} MB)
          </Button>
        ) : (
          <FormSubmitButton
            text={
              <TranslatedText stringId="admin.export.prepareExport" fallback="Prepare export" />
            }
          />
        )}
      </ButtonRow>
    </FormGrid>
  );
};

export const ExporterView = memo(({ title, endpoint, dataTypes, dataTypesSelectable }) => {
  const api = useApi();
  const [dataReadyForSaving, setDataReadyForSaving] = useState(null);

  const onPrepareExport = useCallback(
    async ({ includedDataTypes }) => {
      if (!includedDataTypes.length) return;
      const blob = await api.download(`admin/export/${endpoint}`, {
        includedDataTypes,
      });
      setDataReadyForSaving(blob);
    },
    [api, endpoint],
  );

  const onDownload = useCallback(async () => {
    await saveFile({
      defaultFileName: `${title} export ${getCurrentDateTimeString()}`,
      data: dataReadyForSaving,
      extension: 'xlsx',
    });
  }, [title, dataReadyForSaving]);

  const resetDownload = useCallback(() => setDataReadyForSaving(null), []);

  const renderForm = useCallback(
    props => (
      <ExportForm
        dataTypes={dataTypes}
        dataTypesSelectable={dataTypesSelectable}
        dataReadyForSaving={dataReadyForSaving}
        onDownload={onDownload}
        resetDownload={resetDownload}
        {...props}
      />
    ),
    [
      dataTypes,
      dataTypesSelectable,
      dataReadyForSaving,
      onDownload,
      resetDownload,
    ],
  );

  return (
    <>
      <Form
        onSubmit={onPrepareExport}
        validationSchema={yup.object().shape({
          includedDataTypes: yup.array(),
        })}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{
          includedDataTypes: [...dataTypes],
        }}
        render={renderForm}
      />
    </>
  );
});
