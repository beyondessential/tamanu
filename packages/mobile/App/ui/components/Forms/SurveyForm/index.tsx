import React, { ReactElement, useMemo, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getFormInitialValues, getFormSchema } from './helpers';
import { Form } from '../Form';
import { FormFields } from './FormFields';
import { checkVisibilityCriteria } from '/helpers/fields';
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
  const initialValues = useMemo(() => getFormInitialValues(components, currentUser, patient), [
    components,
  ]);
  const formValidationSchema = useMemo(() => getFormSchema(components), [components]);
  const submitVisibleValues = useCallback(
    (values: any) => {
      // 1. get a list of visible fields
      const visibleFields = new Set(
        components
          .filter(c => checkVisibilityCriteria(c, components, values))
          .map(x => x.dataElement.code),
      );

      // 2. Filter the form values to only include visible fields
      const visibleValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => visibleFields.has(key)),
      );

      // 3. Set visible values in form state?
      return onSubmit(visibleValues);
    },
    [components, onSubmit],
  );

  return (
    <Form
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={submitVisibleValues}
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
        return <FormFields components={components} values={values} note={note} patient={patient} />;
      }}
    </Form>
  );
};
