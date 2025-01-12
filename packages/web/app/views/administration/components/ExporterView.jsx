import React, { memo, useCallback } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { useApi } from '../../../api';
import { Field, Form } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow, TranslatedText } from '../../../components';
import { FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { notifySuccess } from '../../../utils';

const ExportForm = ({ dataTypes, dataTypesSelectable }) => (
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
      <FormSubmitButton
        text={<TranslatedText stringId="general.action.export" fallback="Export" />}
      />
    </ButtonRow>
  </FormGrid>
);

export const ExporterView = memo(({ title, endpoint, dataTypes, dataTypesSelectable }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();

  const onSubmit = useCallback(
    async ({ includedDataTypes }) => {
      await saveFile({
        defaultFileName: `${title} export ${getCurrentDateTimeString()}`,
        getData: async () => api.download(`admin/export/${endpoint}`, { includedDataTypes }),
        extension: 'xlsx',
      });
      notifySuccess(
        getTranslation('document.notification.downloadSuccess', 'Successfully downloaded file'),
      );
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
    <Form
      onSubmit={onSubmit}
      validationSchema={yup.object().shape({
        includedDataTypes: yup.array(),
      })}
      formType={FORM_TYPES.CREATE_FORM}
      initialValues={{
        includedDataTypes: [...dataTypes],
      }}
      render={renderForm}
    />
  );
});
