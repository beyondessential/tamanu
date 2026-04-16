import { FORM_TYPES } from '@tamanu/constants/forms';
import { ButtonRow, Form, FormGrid, FormSubmitButton, useDateTime } from '@tamanu/ui-components';
import React, { memo, useCallback } from 'react';
import * as yup from 'yup';

import { useApi } from '../../../api';
import { TranslatedText } from '../../../components';
import { AutocompleteField, Field } from '../../../components/Field';
import { notifySuccess } from '../../../utils';
import { saveFile } from '../../../utils/fileSystemAccess';
import { useProgramsQuery } from '../programs/programs/queries';

const ExportForm = ({ options = [] }) => (
  <FormGrid columns={1} data-testid="formgrid-hbbc">
    <Field
      name="programId"
      label={
        <TranslatedText
          stringId="admin.export.selectProgram.label"
          fallback="Select program to export"
          data-testid="translatedtext-xfw0"
        />
      }
      component={AutocompleteField}
      options={options}
      required
      data-testid="field-mrcx"
    />
    <ButtonRow alignment="left" data-testid="buttonrow-zx6c">
      <FormSubmitButton
        text={<TranslatedText stringId="general.action.export" fallback="Export" />}
        data-testid="formsubmitbutton-uyje"
      />
    </ButtonRow>
  </FormGrid>
);

function programsToOptions(programs) {
  return programs.map(p => ({ label: p.name, value: p.id }));
}

export const ProgramExporterView = memo(({ setIsLoading }) => {
  const api = useApi();
  const { getCurrentDateTime } = useDateTime();

  const { data: programOptions } = useProgramsQuery({ select: programsToOptions });

  const onSubmit = useCallback(
    async ({ programId }) => {
      try {
        setIsLoading(true);
        const programName = programOptions.find(option => option.value === programId).label;
        await saveFile({
          defaultFileName: `Program-${programName}-export-${getCurrentDateTime()}`,
          getData: async () => await api.download(`admin/export/program/${programId}`),
          extension: 'xlsx',
        });
        notifySuccess(
          <TranslatedText
            stringId="document.notification.downloadSuccess"
            fallback="Successfully downloaded file"
          />,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [api, getCurrentDateTime, programOptions, setIsLoading],
  );

  const renderForm = useCallback(
    props => <ExportForm options={programOptions} {...props} data-testid="exportform-qx7d" />,
    [programOptions],
  );

  return (
    <Form
      onSubmit={onSubmit}
      validationSchema={yup.object().shape({
        programId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="admin.export.validation.program.path"
              fallback="Program"
              data-testid="translatedtext-zs1m"
            />,
          ),
      })}
      formType={FORM_TYPES.CREATE_FORM}
      initialValues={{
        includedDataTypes: {
          programId: '',
        },
      }}
      render={renderForm}
      data-testid="form-c4xc"
    />
  );
});
