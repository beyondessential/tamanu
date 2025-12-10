import React, { memo, useCallback, useMemo } from 'react';
import { startCase } from 'lodash';
import * as yup from 'yup';
import styled from 'styled-components';
import { pluralize } from 'inflection';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormSubmitButton, ButtonRow, FormGrid } from '@tamanu/ui-components';

import { useApi } from '../../../api';
import { Field } from '../../../components/Field';
import { ExpandedMultiSelectField } from '../../../components/Field/ExpandedMultiSelectField';
import { TranslatedText } from '../../../components';
import { saveFile } from '../../../utils/fileSystemAccess';
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
  <StyledFormGrid columns={1} data-testid="styledformgrid-11t3">
    {dataTypesSelectable && (
      <Field
        name="includedDataTypes"
        label={
          <TranslatedText
            stringId="admin.export.includedDataTypes.label"
            fallback="Select data types to export"
            data-testid="translatedtext-oz7u"
          />
        }
        component={ExpandedMultiSelectField}
        options={dataTypes.map(value => ({ value, label: startCase(value) }))}
        data-testid="field-aww5"
      />
    )}
    <ButtonRow alignment="left" data-testid="buttonrow-zs3j">
      <ExportButton text={buttonLabel} data-testid="exportbutton-7sto" />
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
            data-testid="translatedtext-vthi"
          />{' '}
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
          data-testid="exportform-r3vl"
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
        data-testid="form-mmoh"
      />
    );
  },
);
