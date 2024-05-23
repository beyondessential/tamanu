import React, { memo, useCallback, useMemo } from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { useApi } from '../../../api';
import { Field, Form, SelectField } from '../../../components/Field';
import { FormGrid } from '../../../components/FormGrid';
import { ButtonRow } from '../../../components/ButtonRow';
import { FormSubmitButton } from '../../../components/Button';
import { saveFile } from '../../../utils/fileSystemAccess';
import { FORM_TYPES } from '../../../constants';
import { useQuery } from '@tanstack/react-query';

const ExportForm = ({ options = [] }) => (
  <FormGrid columns={1}>
    <Field
      name="programId"
      label="Select program to export"
      component={SelectField}
      options={options}
      required
    />
    <ButtonRow>
      <FormSubmitButton text="Export" />
    </ButtonRow>
  </FormGrid>
);

export const ProgramExporterView = memo(({ title, setIsLoading }) => {
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
        const blob = await api.download(`admin/export/program/${programId}`);
        await saveFile({
          defaultFileName: `Program-${programName}-export ${getCurrentDateTimeString()}`,
          data: blob,
          extension: 'xlsx',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [api, title, programOptions],
  );

  const renderForm = useCallback(props => <ExportForm options={programOptions} {...props} />, [
    programOptions,
  ]);

  return (
    <>
      <Form
        onSubmit={onSubmit}
        validationSchema={yup.object().shape({
          programId: yup.string().required(),
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
