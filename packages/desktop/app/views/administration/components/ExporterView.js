import React, { memo, useCallback } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';
import { getCurrentCountryTimeZoneDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../../api';
import { Form, Field } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { FormSubmitButton } from '../../../components/Button';
import { saveBlobAs } from '../../../utils/saveBlobAs';

const ExportForm = ({ isSubmitting, dataTypes, dataTypesSelectable }) => (
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
      <FormSubmitButton type="submit" disabled={isSubmitting}>
        Export
      </FormSubmitButton>
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
        defaultFileName: `${title} export ${getCurrentCountryTimeZoneDateTimeString()
          .replaceAll(':', '-')
          .replaceAll('/', '-')}.xlsx`,
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
