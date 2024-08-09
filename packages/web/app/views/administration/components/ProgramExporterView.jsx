import React, { memo, useCallback, useMemo } from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../../api';
import { AutocompleteField, Field, Form } from '../../../components/Field';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { useQuery } from '@tanstack/react-query';
import { TranslatedText } from '../../../components/Translation';

const ExportForm = ({ options = [] }) => (
  <FormGrid columns={1}>
    <Field
      name="programId"
      label={
        <TranslatedText
          stringId="admin.program.export.program.selectLabel"
          fallback="Select program to export"
        />
      }
      component={AutocompleteField}
      options={options}
      required
    />
    <ButtonRow>
      <FormSubmitButton text="Export" />
    </ButtonRow>
  </FormGrid>
);

export const ProgramExporterView = memo(({ setIsLoading }) => {
  const api = useApi();

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
              <TranslatedText stringId="admin.program.export.program.label" fallback="Program" />,
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
