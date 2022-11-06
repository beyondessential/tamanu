import React, { ReactElement, useMemo, useEffect } from 'react';

import { useSelector } from 'react-redux';
import {
  getFormInitialValues,
  getFormSchema,
} from './helpers';
import { Form } from '../Form';
import { FormFields } from './FormFields';

import { runCalculations } from '~/ui/helpers/calculations';
import { authUserSelector } from '/helpers/selectors';

export type SurveyFormProps = {
  onSubmit: (values: any) => Promise<void>;
  components: any;
  patient: any;
  note: string;
};

export const SurveyForm = ({
  onSubmit,
  components,
  note,
  patient,
}: SurveyFormProps): ReactElement => {
  const currentUser = useSelector(authUserSelector);
  const initialValues = useMemo(
    () => getFormInitialValues(components, currentUser, patient),
    [components],
  );
  const formValidationSchema = useMemo(() => getFormSchema(components), [components]);

  return (
    <Form
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={onSubmit}
    >
      {({ values, setFieldValue }): ReactElement => {
        useEffect(() => {
          // recalculate dynamic fields
          const calculatedValues = runCalculations(components, values);

          // write values that have changed back into answers
          Object.entries(calculatedValues)
            .filter(([k, v]) => values[k] !== v)
            .map(([k, v]) => setFieldValue(k, v));
        }, [values]);
        return (
          <FormFields
            components={components}
            values={values}
            note={note}
            patient={patient}
          />
        );
      }}
    </Form>
  );
};
