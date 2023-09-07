import React, { ReactElement, useMemo, useEffect, useCallback, useState, Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { getFormInitialValues, getFormSchema } from './helpers';
import { ISurveyComponent, IPatientAdditionalData } from '~/types';
import { Form } from '../Form';
import { FormFields } from './FormFields';
import { checkVisibilityCriteria } from '/helpers/fields';
import { runCalculations } from '~/ui/helpers/calculations';
import { authUserSelector } from '/helpers/selectors';

export type SurveyFormProps = {
  onSubmit: (values: any) => Promise<void>;
  openExitModal: () => Promise<void>;
  components: ISurveyComponent[];
  patient: any;
  note: string;
  validate: any;
  patientAdditionalData: IPatientAdditionalData[];
  setCurrentScreenIndex: Dispatch<SetStateAction<number>>;
  currentScreenIndex: number;
};

export const SurveyForm = ({
  onSubmit,
  components,
  note,
  patient,
  patientAdditionalData,
  validate,
  openExitModal,
  setCurrentScreenIndex,
  currentScreenIndex
}: SurveyFormProps): ReactElement => {
  const currentUser = useSelector(authUserSelector);
  const initialValues = useMemo(
    () => getFormInitialValues(components, currentUser, patient, patientAdditionalData),
    [components, currentUser, patient, patientAdditionalData],
  );
  const [formValues, setFormValues] = useState(initialValues);
  const formValidationSchema = useMemo(
    () => getFormSchema(components.filter(c => checkVisibilityCriteria(c, components, formValues))),
    [checkVisibilityCriteria, components, formValues],
  );

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
      validateOnChange
      validateOnBlur
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={submitVisibleValues}
      validate={validate}
    >
      {({ values, setFieldValue }): ReactElement => {
        useEffect(() => {
          // recalculate dynamic fields
          const calculatedValues = runCalculations(components, values);

          // write values that have changed back into answers
          Object.entries(calculatedValues)
            .filter(([key, value]) => values[key] !== value)
            .map(([key, value]) => setFieldValue(key, value, false));

          // set parent formValues variable to the values here
          setFormValues({
            ...values,
            ...calculatedValues,
          });
        }, [values]);
        return (
          <FormFields
            components={components}
            note={note}
            patient={patient}
            openExitModal={openExitModal}
            setCurrentScreenIndex={setCurrentScreenIndex}
            currentScreenIndex={currentScreenIndex}
          />)
      }}
    </Form>
  );
};
