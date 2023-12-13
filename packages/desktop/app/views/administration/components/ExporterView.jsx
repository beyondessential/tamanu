import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { startCase } from 'lodash';
import React, { memo, useCallback } from 'react';
import * as yup from 'yup';

import { useApi } from '../../../api';
import { FormSubmitButton } from '../../../components/Button';
import { ButtonRow } from '../../../components/ButtonRow';
import { Field, Form } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { saveBlobAs } from '../../../utils/saveBlobAs';

const ExportForm = ({ dataTypes, dataTypesSelectable }) => (
  <FormGrid columns={1}>
    {dataTypesSelectable && (
      <Field
        name="includedDataTypes"
        label="Select data types to export"
        component={ExpandedMultiSelectField}
        options={dataTypes.map(value => ({ value, label: startCase(value) }))}
      />
    )}
    <ButtonRow>
      <FormSubmitButton text="Export" />
    </ButtonRow>
  </FormGrid>
);

export const ExporterView = memo(({ title, endpoint, dataTypes, dataTypesSelectable }) => {
  const api = useApi();

  const onSubmit = useCallback(
    async ({ includedDataTypes }) => {
      const blob = await api.download(`admin/export/${endpoint}`, {
        includedDataTypes,
      });
      saveBlobAs(blob, {
        defaultFileName: `${title} export ${
          getCurrentDateTimeString()
            .replaceAll(':', '-')
            .replaceAll('/', '-')
        }.xlsx`,
      });
    },
    [api, title, endpoint],
  );

  const renderForm = useCallback(
    props => (
      <ExportForm dataTypes={dataTypes} dataTypesSelectable={dataTypesSelectable} {...props} />
    ),
    [dataTypes, dataTypesSelectable],
  );

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
