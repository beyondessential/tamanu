import React, {
  Dispatch,
  MutableRefObject,
  ReactElement,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useFormikContext } from 'formik';
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

function computeVisibleKey(
  components: ISurveyScreenComponent[],
  values: Record<string, any>,
): string {
  return components
    .filter(c => checkVisibilityCriteria(c, components, values))
    .map(c => c.id)
    .join(',');
}

const EMPTY_CALCULATED_VALUES = {};

interface SurveyFormInnerProps {
  components: ISurveyScreenComponent[];
  hasCalculations: boolean;
  patient: any;
  encounterProp?: { encounterType?: string };
  formValuesRef: MutableRefObject<Record<string, any>>;
  setVisibleComponentKey: React.Dispatch<React.SetStateAction<string>>;
  onCancel?: () => Promise<void>;
  onGoBack?: () => void;
  setCurrentScreenIndex: Dispatch<SetStateAction<number>>;
  currentScreenIndex: number;
}

const SurveyFormInner = ({
  components,
  hasCalculations,
  patient,
  encounterProp,
  formValuesRef,
  setVisibleComponentKey,
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

  const mergedValues = useMemo(
    () => (hasCalculations ? { ...values, ...calculatedValues } : values),
    [values, calculatedValues, hasCalculations],
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
      setValues(
        { ...values, ...changedCalculatedValues },
        false,
      );
    }
  }, [calculatedValues, setValues, values]);

  // Update the ref (cheap, no render) and only setState when visibility changes
  useEffect(() => {
    formValuesRef.current = mergedValues;
    const nextKey = computeVisibleKey(components, mergedValues);
    setVisibleComponentKey(prev => (prev === nextKey ? prev : nextKey));
  }, [components, mergedValues, formValuesRef, setVisibleComponentKey]);

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
      return { encounter };
    },
    [patient.id],
  );

  const { encounter } = encounterResult || {};
  const encounterProp = useMemo(
    () => encounter ? { encounterType: encounter.encounterType } : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [encounter?.encounterType],
  );
  const hasCalculations = useMemo(
    () => components.some(c => c.calculation),
    [components],
  );

  const formValuesRef = useRef(initialValues);
  const [visibleComponentKey, setVisibleComponentKey] = useState(
    () => computeVisibleKey(components, initialValues),
  );

  const formValidationSchema = useMemo(() => {
    const visible = components.filter(c =>
      checkVisibilityCriteria(c, components, formValuesRef.current),
    );
    return getFormSchema(visible, { encounterType: encounter?.encounterType }, getTranslation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleComponentKey, encounter?.encounterType, getTranslation]);

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
      validateOnChange
      validateOnBlur
      validationSchema={formValidationSchema}
      initialValues={initialValues}
      onSubmit={submitVisibleValues}
      validate={validate}
    >
      {() => (
        <SurveyFormInner
          components={components}
          hasCalculations={hasCalculations}
          patient={patient}
          encounterProp={encounterProp}
          formValuesRef={formValuesRef}
          setVisibleComponentKey={setVisibleComponentKey}
          onCancel={onCancel}
          setCurrentScreenIndex={setCurrentScreenIndex}
          currentScreenIndex={currentScreenIndex}
          onGoBack={onGoBack}
        />
      )}
    </Form>
  );
};
