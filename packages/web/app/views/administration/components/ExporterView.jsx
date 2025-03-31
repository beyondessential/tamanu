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
import { ButtonRow, TranslatedText } from '../../../components';
import { FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { notifySuccess } from '../../../utils';

const StyledFormGrid = styled(FormGrid)`
  margin-left: 10px;
`;

const ExportForm = ({
  dataTypes,
  dataTypesSelectable,
  buttonLabel,
  ExportButton = FormSubmitButton,
}) => (
  <StyledFormGrid columns={1}>
    {dataTypesSelectable && (
      <Field
        name="includedDataTypes"
        label={
          <TranslatedText
            stringId="admin.export.includedDataTypes.label"
            fallback="Select data types to export"
            data-test-id='translatedtext-s27v' />
        }
        component={ExpandedMultiSelectField}
        options={dataTypes.map(value => ({ value, label: startCase(value) }))}
        data-test-id='field-mmhz' />
    )}
    <ButtonRow alignment="left" data-test-id='buttonrow-qdu2'>
      <ExportButton text={buttonLabel} />
    </ButtonRow>
  </StyledFormGrid>
);

export const ExporterView = memo(
  ({ title, endpoint, dataTypes, dataTypesSelectable, ExportButton }) => {
    const api = useApi();
    const { getTranslation } = useTranslation();

    const onSubmit = useCallback(
      async queryParameters => {
        await saveFile({
          defaultFileName: `${title} export ${getCurrentDateTimeString()}`,
          getData: async () => api.download(`admin/export/${endpoint}`, queryParameters),
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
          <TranslatedText
            stringId="general.action.export"
            fallback="Export"
            data-test-id='translatedtext-82uw' />{' '}
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
          ExportButton={ExportButton}
          {...props}
        />
      ),
      [dataTypes, dataTypesSelectable, ExportButton, buttonLabel],
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
  },
);
