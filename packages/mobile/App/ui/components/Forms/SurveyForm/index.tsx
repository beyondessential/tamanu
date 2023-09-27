import React, { ReactElement, useMemo, useEffect, useCallback, useState, Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { getFormInitialValues, getFormSchema } from './helpers';
import { IPatientAdditionalData } from '~/types/IPatientAdditionalData';
import { ISurveyScreenComponent } from '~/types/ISurvey';
import { ISurveyResponseValues, SubmitSurveyResponseFunc } from '~/types/ISurveyResponse';
import { Form } from '../Form';
import { FormFields } from './FormFields';
import { shouldSaveComponent, checkVisibilityCriteria } from '/helpers/fields';
import { runCalculations } from '~/ui/helpers/calculations';
import { authUserSelector } from '/helpers/selectors';

export type SurveyFormProps = {
  onSubmit: SubmitSurveyResponseFunc;
  openExitModal: () => Promise<void>;
  components: ISurveyScreenComponent[];
  onCancel?: () => Promise<void>;
  onGoBack?: () => void;
  patient: any;
  note: string;
  validate?: any;
  patientAdditionalData: IPatientAdditionalData;
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
  onCancel,
  setCurrentScreenIndex,
  currentScreenIndex,
  onGoBack,
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

  const submitSaveableValues = useCallback(
    (values: ISurveyResponseValues) => {
      // 1. get a list of saveable fields (visible and with config.omitFromResult)
      const saveableFields = new Set(
        components
          .filter(c => shouldSaveComponent(c, components, values))
          .map(x => x.dataElement.code),
      );

      // 2. Filter the form values to only include saveable fields
      const saveableValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => saveableFields.has(key)),
      );

      // 3. Set saveable values in form state?
      return onSubmit(saveableValues);
    },
    [components, onSubmit],
  );

  return (
    <Form
      validateOnChange
      validateOnBlur
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={submitSaveableValues}
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
            onCancel={onCancel}
            setCurrentScreenIndex={setCurrentScreenIndex}
            currentScreenIndex={currentScreenIndex}
            onGoBack={onGoBack}
          />
        );
      }}
    </Form>
  );
};
