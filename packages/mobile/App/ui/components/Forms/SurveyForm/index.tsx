import React, {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { FormikHandlers } from 'formik';
import { getFormInitialValues, getFormSchema } from './helpers';
import { IPatientAdditionalData, ISurveyScreenComponent } from '~/types';
import { Form } from '../Form';
import { FormFields } from './FormFields';
import { checkVisibilityCriteria } from '/helpers/fields';
import { runCalculations } from '~/ui/helpers/calculations';
import { authUserSelector } from '/helpers/selectors';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '../../ErrorScreen';
import { LoadingScreen } from '../../LoadingScreen';
import { IPatientProgramRegistration } from '~/types/IPatientProgramRegistration';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';

export type SurveyFormProps = {
  onSubmit: (values: any) => Promise<void>;
  openExitModal: () => Promise<void>;
  components: ISurveyScreenComponent[];
  onCancel?: () => Promise<void>;
  onGoBack?: () => void;
  patient: any;
  note: string;
  validate?: any;
  patientAdditionalData: IPatientAdditionalData;
  patientProgramRegistration?: IPatientProgramRegistration;
  setCurrentScreenIndex: Dispatch<SetStateAction<number>>;
  currentScreenIndex: number;
};

export const SurveyForm = ({
  onSubmit,
  components,
  note,
  patient,
  patientAdditionalData,
  patientProgramRegistration,
  validate,
  onCancel,
  setCurrentScreenIndex,
  currentScreenIndex,
  onGoBack,
}: SurveyFormProps): ReactElement => {
  const { getTranslation } = useTranslation();
  const currentUser = useSelector(authUserSelector);
  const { customPatientFieldValues } = usePatientAdditionalData(
    patient?.id,
  );
  const initialValues = useMemo(
    () =>
      getFormInitialValues(
        components,
        currentUser,
        patient,
        patientAdditionalData,
        patientProgramRegistration,
        customPatientFieldValues,
      ),
    [components, currentUser, patient, patientAdditionalData, patientProgramRegistration, customPatientFieldValues],
  );
  const [encounterResult, encounterError, isEncounterLoading] = useBackendEffect(
    async ({ models }) => {
      const encounter = await models.Encounter.getCurrentEncounterForPatient(patient.id);
      return {
        encounter,
      };
    },
    [patient.id],
  );

  const { encounter } = encounterResult || {};
  const [formValues, setFormValues] = useState(initialValues);
  const formValidationSchema = useMemo(
    () =>
      getFormSchema(
        components.filter(c => checkVisibilityCriteria(c, components, formValues)),
        { encounterType: encounter?.encounterType },
        getTranslation,
      ),
    [encounter?.encounterType, components, formValues, getTranslation],
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

  if (encounterError) {
    return <ErrorScreen error={encounterError} />;
  }

  if (isEncounterLoading) {
    return <LoadingScreen />;
  }

  return (
    <Form
      validateOnChange
      validateOnBlur
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={submitVisibleValues}
      validate={validate}
    >
      {({ values, setFieldValue, isSubmitting }: FormikHandlers): ReactElement => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
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
        }, [values, setFieldValue]);
        return (
          <FormFields
            components={components}
            note={note}
            patient={patient}
            isSubmitting={isSubmitting}
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
