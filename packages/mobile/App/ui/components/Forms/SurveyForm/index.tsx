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
import { FormikProps } from 'formik';
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
  validate?: any;
  patientAdditionalData: IPatientAdditionalData;
  patientProgramRegistration?: IPatientProgramRegistration;
  setCurrentScreenIndex: Dispatch<SetStateAction<number>>;
  currentScreenIndex: number;
};

export const SurveyForm = ({
  onSubmit,
  components,
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
  const visibleComponents = useMemo(
    () => components.filter(c => checkVisibilityCriteria(c, components, formValues)),
    [components, formValues],
  );
  const visibleComponentKey = useMemo(
    () => visibleComponents.map(c => c.id).join(','),
    [visibleComponents],
  );
  const formValidationSchema = useMemo(
    () =>
      getFormSchema(visibleComponents, { encounterType: encounter?.encounterType }, getTranslation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleComponentKey, encounter?.encounterType, getTranslation],
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
      validateOnBlur
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={submitVisibleValues}
      validate={validate}
    >
      {({ values, setValues, isSubmitting }: FormikProps<any>): ReactElement => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          // recalculate dynamic fields
          const calculatedValues = runCalculations(components, values);
          const changes = Object.entries(calculatedValues).filter(
            ([key, value]) => values[key] !== value,
          );

          if (changes.length > 0) {
            const changedCalculatedValues = Object.fromEntries(changes);
            setValues(
              prev => ({
                ...prev,
                ...changedCalculatedValues,
              }),
              false,
            );
          }

          const nextFormValues = {
            ...values,
            ...calculatedValues,
          };

          setFormValues(prev => {
            const keys = Object.keys(nextFormValues);
            if (
              keys.length === Object.keys(prev).length &&
              keys.every(k => prev[k] === nextFormValues[k])
            ) {
              return prev;
            }
            return nextFormValues;
          });
        }, [components, setValues, values]);
        return (
          <FormFields
            components={components}
            patient={patient}
            encounter={encounter ? { encounterType: encounter.encounterType } : undefined}
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
