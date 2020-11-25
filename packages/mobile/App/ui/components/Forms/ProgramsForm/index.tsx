import React, { ReactElement, useMemo } from 'react';
import { Formik } from 'formik';
import { FullView } from '/styled/common';
import { Button } from '../../Button';
import { theme } from '/styled/theme';
import { FormScreenView } from '../FormScreenView';
import { ProgramsFormProps } from '../../../interfaces/forms/ProgramsFormProps';
import { StyledText, StyledView } from '~/ui/styled/common';
import { FormFields } from './FormFields';
import {
  getFormInitialValues,
  getFormSchema,
} from './helpers';

export const ProgramsForm = ({
  onSubmit,
  components,
  note,
}: ProgramsFormProps): ReactElement => {
  const initialValues = useMemo(() => getFormInitialValues(components), [components]);
  const formValidationSchema = useMemo(() => getFormSchema(components), [components]);

  return (
    <Formik
      validationSchema={formValidationSchema}
      initialValues={{}}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, values }): ReactElement => (
        <FullView>
          <FormScreenView>
            <FormFields
              components={components}
              values={values}
              note={note}
              onSubmit={handleSubmit}
            />
          </FormScreenView>
        </FullView>
      )}
    </Formik>
  );
};
