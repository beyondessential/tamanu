import React, { memo, useCallback } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';
import { getCurrentCountryTimeZoneDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../../api';
import { Form, Field } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { Button } from '../../../components/Button';
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
      <Button type="submit" disabled={isSubmitting}>
        Export
      </Button>
    </ButtonRow>
  </FormGrid>
);

export const ExporterView = memo(
  ({ title, endpoint, dataTypes, dataTypesSelectable, useChunkData }) => {
    const api = useApi();

    const onSubmit = useCallback(
      async ({ includedDataTypes }) => {
        let blob = new Blob([]);
        if (useChunkData) {
          // Generate the file without downloading it.
          const { sizeInBytes, maxChunkSizeInBytes } = await api.post(
            `admin/export/${endpoint}/generate`,
            {
              includedDataTypes,
            },
          );

          // Download the file using chunks
          let start = 0;
          let end = Math.min(maxChunkSizeInBytes, sizeInBytes);
          while (start < sizeInBytes) {
            const chunkedBlob = await api.download(`admin/export/download`, { start, end });
            blob = new Blob([blob, chunkedBlob]);
            start = end + 1;
            end = Math.min(end + maxChunkSizeInBytes, sizeInBytes);
          }
        } else {
          // Generate and download the file
          blob = await api.download(`admin/export/${endpoint}`, {
            includedDataTypes,
          });
        }
        saveBlobAs(blob, {
          defaultFileName: `${title} export ${getCurrentCountryTimeZoneDateTimeString()
            .replaceAll(':', '-')
            .replaceAll('/', '-')}.xlsx`,
        });

        if (useChunkData) {
          await api.post('admin/export/completed');
        }
      },
      [api, title, endpoint, useChunkData],
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
  },
);
