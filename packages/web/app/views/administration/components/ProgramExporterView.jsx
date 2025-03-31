import React, { memo, useCallback, useMemo } from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import { useApi } from '../../../api';
import { AutocompleteField, Field, Form } from '../../../components/Field';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow, TranslatedText } from '../../../components';
import { FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '../../../contexts/Translation.jsx';
import { notifySuccess } from '../../../utils';

const ExportForm = ({ options = [] }) => (
  <FormGrid columns={1}>
    <Field
      name="programId"
      label={
        <TranslatedText
          stringId="admin.export.selectProgram.label"
          fallback="Select program to export"
          data-testid='translatedtext-qucr' />
      }
      component={AutocompleteField}
      options={options}
      required
      data-testid='field-qii5' />
    <ButtonRow alignment="left" data-testid='buttonrow-0zdb'>
      <FormSubmitButton text="Export" data-testid='formsubmitbutton-95wc' />
    </ButtonRow>
  </FormGrid>
);

export const ProgramExporterView = memo(({ setIsLoading }) => {
  const api = useApi();
  const { getTranslation } = useTranslation();

  const { data: programs } = useQuery(['programs'], () => api.get('admin/programs'));

  const programOptions = useMemo(
    () =>
      programs?.data?.map(program => ({
        label: program.name,
        value: program.id,
      })),
    [programs],
  );

  const onSubmit = useCallback(
    async ({ programId }) => {
      try {
        setIsLoading(true);
        const programName = programOptions.find(option => option.value === programId).label;
        await saveFile({
          defaultFileName: `Program-${programName}-export-${getCurrentDateTimeString()}`,
          getData: async () => await api.download(`admin/export/program/${programId}`),
          extension: 'xlsx',
        });
        notifySuccess(
          getTranslation('document.notification.downloadSuccess', 'Successfully downloaded file'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [api, programOptions],
  );

  const renderForm = useCallback(props => <ExportForm options={programOptions} {...props} />, [
    programOptions,
  ]);

  return (
    <>
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
                data-testid='translatedtext-lyhz' />,
            ),
        })}
        formType={FORM_TYPES.CREATE_FORM}
        initialValues={{
          includedDataTypes: {
            programId: '',
          },
        }}
        render={renderForm}
      />
    </>
  );
});
