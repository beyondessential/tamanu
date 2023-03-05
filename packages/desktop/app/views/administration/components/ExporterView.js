import React, { memo, useCallback } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';

import { useApi } from '../../../api';
import { Form, Field } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { Button } from '../../../components/Button';

const ExportForm = ({ isSubmitting, dataTypes }) => (
  <FormGrid columns={1}>
    {dataTypes && (
      <Field
        name="includedDataTypes"
        label="Select data types to export"
        component={ExpandedMultiSelectField}
        options={dataTypes.map(value => ({ value, label: startCase(value) }))}
      />
    )}
    <ButtonRow>
      <Button type="submit" disabled={isSubmitting}>
        Export
      </Button>
    </ButtonRow>
  </FormGrid>
);

const saveAs = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const ExporterView = memo(({ endpoint, dataTypes }) => {
  const api = useApi();

  const onSubmit = useCallback(
    async ({ includedDataTypes }) => {
      const blob = await api.download(`admin/export/${endpoint}`, { includedDataTypes });
      saveAs(blob, `export-${endpoint}.xlsx`);
    },
    [api, endpoint],
  );

  const renderForm = useCallback(props => <ExportForm dataTypes={dataTypes} {...props} />, [
    dataTypes,
  ]);

  return (
    <>
      <Form
        onSubmit={onSubmit}
        validationSchema={yup.object().shape({
          includedDataTypes: yup.array(),
        })}
        initialValues={{
          includedDataTypes: [...dataTypes],
        }}
        render={renderForm}
      />
    </>
  );
});
