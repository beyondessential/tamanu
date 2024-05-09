import React, { ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { compose } from 'redux';
import { Formik } from 'formik';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { FullView } from '/styled/common';
import { formatISO9075, parseISO } from 'date-fns';
import { SubmitSection } from './SubmitSection';
import { generateId, getConfiguredPatientAdditionalDataFields } from '~/ui/helpers/patient';
import { Patient } from '~/models/Patient';
import { withPatient } from '~/ui/containers/Patient';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Routes } from '~/ui/helpers/routes';
import { ALL_ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { getPatientDetailsValidation } from './patientDetailsValidationSchema';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { getInitialAdditionalValues } from '../../PatientAdditionalDataForm/helpers';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { IPatient, IPatientAdditionalData } from '~/types';

export type FormSection = {
  scrollToField: (fieldName: string) => () => void;
};

const styles = StyleSheet.create({
  KeyboardAvoidingView: { flex: 1 },
  ScrollView: { flex: 1 },
  ScrollViewContentContainer: { padding: 20 },
});

const getPatientInitialValues = (
  isEdit: boolean,
  patient: IPatient,
  patientAdditionalData: IPatientAdditionalData,
  customPatientFieldValues,
  getBool: (key: string) => boolean,
): {} => {
  if (!isEdit || !patient) {
    return {};
  }

  // Only grab the fields that will get used in the form
  const {
    firstName,
    middleName,
    lastName,
    culturalName,
    dateOfBirth,
    email,
    sex,
    villageId,
  } = patient;

  const requiredPADFields = getConfiguredPatientAdditionalDataFields(
    ALL_ADDITIONAL_DATA_FIELDS,
    true,
    getBool,
  );

  const initialPatientAdditionalDataValues = getInitialAdditionalValues(
    patientAdditionalData,
    requiredPADFields,
  );

  const initialPatientCustomDataValues = {};
  for (const key in customPatientFieldValues) {
    initialPatientCustomDataValues[key] = customPatientFieldValues[key][0].value;
  }

  const initialPatientValues = {
    firstName,
    middleName,
    lastName,
    culturalName,
    dateOfBirth: parseISO(dateOfBirth),
    email,
    sex,
    villageId,
    ...initialPatientAdditionalDataValues,
    ...initialPatientCustomDataValues,
  };

  return Object.fromEntries(
    Object.entries(initialPatientValues).filter(([_, value]) => value != null),
  );
};

const containsAdditionalData = values =>
  ALL_ADDITIONAL_DATA_FIELDS.some(fieldName => Object.keys(values).includes(fieldName));

export const FormComponent = ({
  selectedPatient,
  setSelectedPatient,
  isEdit,
  children,
}): ReactElement => {
  const navigation = useNavigation();
  const { customPatientFieldValues, patientAdditionalData, loading } = usePatientAdditionalData(
    selectedPatient?.id,
  );
  const onCreateNewPatient = useCallback(
    async (values, { resetForm }) => {
      // submit form to server for new patient
      const { dateOfBirth, ...otherValues } = values;
      const newPatient = await Patient.createAndSaveOne({
        ...otherValues,
        dateOfBirth: formatISO9075(dateOfBirth),
        displayId: generateId(),
      });

      if (containsAdditionalData(values)) {
        await PatientAdditionalData.updateForPatient(newPatient.id, values);
      }

      // Update any custom field definitions contained in this form
      const customValuesToUpdate = Object.keys(values).filter(key =>
        Object.keys(customPatientFieldValues).includes(key),
      );
      await Promise.all(
        customValuesToUpdate.map(definitionId =>
          PatientFieldValue.updateOrCreateForPatientAndDefinition(
            selectedPatient.id,
            definitionId,
            values[definitionId],
          ),
        ),
      );

      await Patient.markForSync(newPatient.id);

      // Reload instance to get the complete village fields
      // (related fields won't display all info otherwise)
      const reloadedPatient = await Patient.findOne(newPatient.id);
      setSelectedPatient(reloadedPatient);
      resetForm();
      navigation.navigate(Routes.HomeStack.RegisterPatientStack.NewPatient);
    },
    [navigation, loading],
  );

  const onEditPatient = useCallback(
    async values => {
      // Update patient values (helper function uses .save()
      // so it will mark the record for upload).
      const { dateOfBirth, ...otherValues } = values;
      await Patient.updateValues(selectedPatient.id, {
        dateOfBirth: formatISO9075(dateOfBirth),
        ...otherValues,
      });

      if (containsAdditionalData(values)) {
        await PatientAdditionalData.updateForPatient(selectedPatient.id, values);
      }

      // Update any custom field definitions contained in this form
      const customValuesToUpdate = Object.keys(values).filter(key =>
        Object.keys(customPatientFieldValues).includes(key),
      );
      await Promise.all(
        customValuesToUpdate.map(definitionId =>
          PatientFieldValue.updateOrCreateForPatientAndDefinition(
            selectedPatient.id,
            definitionId,
            values[definitionId],
          ),
        ),
      );

      // Loading the instance is necessary to get all of the fields
      // from the relations that were updated, not just their IDs.
      const editedPatient = await Patient.findOne(selectedPatient.id);

      // Mark patient for sync and update redux state
      await Patient.markForSync(editedPatient.id);

      setSelectedPatient(editedPatient);

      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation, loading],
  );

  const { getBool, getString } = useLocalisation();

  return loading ? (
    <LoadingScreen />
  ) : (
    <FullView padding={10}>
      <Formik
        onSubmit={isEdit ? onEditPatient : onCreateNewPatient}
        validationSchema={getPatientDetailsValidation(getBool, getString)}
        initialValues={getPatientInitialValues(
          isEdit,
          selectedPatient,
          patientAdditionalData,
          customPatientFieldValues,
          getBool,
        )}
      >
        {({ handleSubmit }): JSX.Element => (
          <KeyboardAvoidingView style={styles.KeyboardAvoidingView} behavior="padding">
            <ScrollView
              style={styles.ScrollView}
              contentContainerStyle={styles.ScrollViewContentContainer}
            >
              {children}
              <SubmitSection onPress={handleSubmit} isEdit={isEdit} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Formik>
    </FullView>
  );
};

export const PatientPersonalInfoForm = compose<React.FC<{ isEdit?: boolean }>>(withPatient)(
  FormComponent,
);
