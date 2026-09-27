import { useQuery } from '@tanstack/react-query';
import { type FormikConfig, useFormikContext, validateYupSchema, yupToFormErrors } from 'formik';
import React, {
  type Dispatch,
  type ReactElement,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useSelector } from 'react-redux';
import { Database } from '~/infra/db';
import type { IPatientAdditionalData, ISurveyScreenComponent } from '~/types';
import type { GenericFormValues } from '~/types/Forms';
import type { IPatientProgramRegistration } from '~/types/IPatientProgramRegistration';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { runCalculations } from '~/ui/helpers/calculations';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { ErrorScreen } from '../../ErrorScreen';
import { LoadingScreen } from '../../LoadingScreen';
import Form from '../Form';
import { FormFields } from './FormFields';
import { getFormInitialValues, getFormSchema } from './helpers';
import { checkVisibilityCriteria } from '/helpers/fields';
import { authUserSelector } from '/helpers/selectors';

const EMPTY_CALCULATED_VALUES = {};

interface SurveyFormInnerProps {
  components: ISurveyScreenComponent[];
  hasCalculations: boolean;
  patient: any;
  encounterProp?: { encounterType?: string };
  onCancel?: () => void;
  onGoBack?: () => void;
  setCurrentScreenIndex: Dispatch<SetStateAction<number>>;
  currentScreenIndex: number;
}

const SurveyFormInner = ({
  components,
  hasCalculations,
  patient,
  encounterProp,
  onCancel,
  onGoBack,
  setCurrentScreenIndex,
  currentScreenIndex,
}: SurveyFormInnerProps): ReactElement => {
  const { values, setValues, isSubmitting } = useFormikContext<any>();
  const lastAppliedCalculatedValuesRef = useRef<Record<string, any>>({});

  const calculatedValues = useMemo(
    () => (hasCalculations ? runCalculations(components, values) : EMPTY_CALCULATED_VALUES),
    [components, hasCalculations, values],
  );

  // Write calculated values back into Formik so they persist
  useEffect(() => {
    const changes = Object.entries(calculatedValues).filter(
      ([key, value]) => values[key] !== value,
    );
    if (changes.length > 0) {
      const changedCalculatedValues = Object.fromEntries(changes);
      const hasNewCalculatedValue = changes.some(
        ([key, value]) => lastAppliedCalculatedValuesRef.current[key] !== value,
      );
      if (!hasNewCalculatedValue) return;

      lastAppliedCalculatedValuesRef.current = {
        ...lastAppliedCalculatedValuesRef.current,
        ...changedCalculatedValues,
      };
      setValues({ ...values, ...changedCalculatedValues }, false);
    }
  }, [calculatedValues, setValues, values]);

  return (
    <FormFields
      components={components}
      patient={patient}
      encounter={encounterProp}
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      setCurrentScreenIndex={setCurrentScreenIndex}
      currentScreenIndex={currentScreenIndex}
      onGoBack={onGoBack}
    />
  );
};

export type SurveyFormProps = {
  onSubmit: (values: any) => Promise<void>;
  components: ISurveyScreenComponent[];
  onCancel?: () => void;
  onGoBack?: () => void;
  patient: any;
  validate?: FormikConfig<GenericFormValues>['validate'];
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
  const { customPatientFieldValues } = usePatientAdditionalData(patient?.id);
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
    [
      components,
      currentUser,
      patient,
      patientAdditionalData,
      patientProgramRegistration,
      customPatientFieldValues,
    ],
  );
  const {
    data: encounterResult,
    error: encounterError,
    isPending: isEncounterLoading,
  } = useQuery({
    queryKey: [...patientKeys.encounters(patient.id), 'current'],
    queryFn: async () => {
      const encounter = await Database.models.Encounter.getCurrentEncounterForPatient(patient.id);
      return { encounter };
    },
  });

  const { encounter } = encounterResult || {};
  const encounterProp = useMemo(
    () => (encounter ? { encounterType: encounter.encounterType } : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [encounter?.encounterType],
  );
  const hasCalculations = useMemo(() => components.some(c => c.calculation), [components]);

  const validateVisibleFields = useCallback(
    async (values: Record<string, any>) => {
      const visibleComponents = components.filter(c =>
        checkVisibilityCriteria(c, components, values),
      );
      const visibleFieldsSchema = getFormSchema(
        visibleComponents,
        { encounterType: encounter?.encounterType },
        getTranslation,
      );
      const schemaErrors = await (async () => {
        try {
          await validateYupSchema(values, visibleFieldsSchema);
          return {};
        } catch (error) {
          if (error.name !== 'ValidationError') throw error;
          return yupToFormErrors(error);
        }
      })();
      return { ...schemaErrors, ...(await validate?.(values)) };
    },
    [components, encounter?.encounterType, getTranslation, validate],
  );

  const submitVisibleValues = useCallback(
    (values: any) => {
      const visibleFields = new Set(
        components
          .filter(c => checkVisibilityCriteria(c, components, values))
          .map(x => x.dataElement.code),
      );
      const visibleValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => visibleFields.has(key)),
      );
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
      initialValues={initialValues}
      onSubmit={submitVisibleValues}
      validate={validateVisibleFields}
    >
      <SurveyFormInner
        components={components}
        hasCalculations={hasCalculations}
        patient={patient}
        encounterProp={encounterProp}
        onCancel={onCancel}
        setCurrentScreenIndex={setCurrentScreenIndex}
        currentScreenIndex={currentScreenIndex}
        onGoBack={onGoBack}
      />
    </Form>
  );
};
