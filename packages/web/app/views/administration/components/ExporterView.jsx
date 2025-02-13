import React, { memo, useCallback, useMemo } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';
import styled from 'styled-components';
import { pluralize } from 'inflection';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { useApi } from '../../../api';
import { Field, Form } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { FormGrid } from '../../../components/FormGrid';
import { LeftAlignedButtonRow, TranslatedText } from '../../../components';
import { FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { notifySuccess } from '../../../utils';

const StyledFormGrid = styled(FormGrid)`
  margin-left: 10px;
`;

const ExportForm = ({ dataTypes, dataTypesSelectable, buttonLabel }) => (
  <StyledFormGrid columns={1}>
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
    <LeftAlignedButtonRow>
      <FormSubmitButton text={buttonLabel} />
    </LeftAlignedButtonRow>
  </StyledFormGrid>
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

  const buttonLabel = useMemo(() => {
    return (
      <span>
        <TranslatedText stringId="general.action.export" fallback="Export" />{' '}
        {pluralize(title).toLowerCase()}
      </span>
    );
  }, [title]);

  const renderForm = useCallback(
    props => (
      <ExportForm
        dataTypes={dataTypes}
        dataTypesSelectable={dataTypesSelectable}
        buttonLabel={buttonLabel}
        {...props}
      />
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
