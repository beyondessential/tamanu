import React, { ReactElement, useMemo } from 'react';
import * as Yup from 'yup';
import { Formik } from 'formik';

import { Button } from '~/ui/components/Button';
import { theme } from '~/ui/styled/theme';
import { StyledText, StyledView } from '~/ui/styled/common';
import { VerticalPosition } from '~/interfaces/VerticalPosition';
import { IProgram } from '~/types';

import {
  getFormInitialValues,
  getFormSchema,
} from './helpers';
import { FormFields } from './FormFields';

export type SurveyFormProps = {
  onSubmit: (values: any) => void;
  components: any;
  note: string;
};

export const SurveyForm = ({
  onSubmit,
  components,
  note,
}: SurveyFormProps): ReactElement => {
  const initialValues = useMemo(() => getFormInitialValues(components), [components]);
  const formValidationSchema = useMemo(() => getFormSchema(components), [components]);

  return (
    <Formik
      validationSchema={formValidationSchema}
      initialValues={{}}
      onSubmit={onSubmit}
    >
      {({ handleSubmit, values }): ReactElement => (
        <FormFields
          components={components}
          values={values}
          note={note}
          onSubmit={handleSubmit}
        />
      )}
    </Formik>
  );
};
