import React, { ReactElement, ReactNode, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { generateId, generateIdFromPattern } from '@tamanu/utils';
import { compose } from 'redux';
import { Formik } from 'formik';
import { Alert, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { FullView } from '/styled/common';
import { formatISO9075, parseISO } from 'date-fns';
import { SubmitSection } from './SubmitSection';
import {
  getConfiguredPatientAdditionalDataFields,
} from '~/ui/helpers/patient';
import { Patient } from '~/models/Patient';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';
import { ALL_ADDITIONAL_DATA_FIELDS } from '~/ui/helpers/additionalData';
import { getPatientDetailsValidation } from './patientDetailsValidationSchema';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import {
  CustomPatientFieldValues,
  usePatientAdditionalData,
} from '~/ui/hooks/usePatientAdditionalData';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { getInitialAdditionalValues } from '../../PatientAdditionalDataForm/helpers';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';

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
  patient: Patient,
  patientAdditionalData: PatientAdditionalData,
  customPatientFieldValues: CustomPatientFieldValues,
  getSetting: <T>(key: string) => T,
): {} => {
  if (!isEdit || !patient) {
    return {};
  }

  // Only grab the fields that will get used in the form
  const { firstName, middleName, lastName, culturalName, dateOfBirth, email, sex, villageId } =
    patient;

  const requiredPADFields = getConfiguredPatientAdditionalDataFields(
    ALL_ADDITIONAL_DATA_FIELDS,
    true,
    getSetting,
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

const containsAdditionalData = (values) =>
  ALL_ADDITIONAL_DATA_FIELDS.some((fieldName) => Object.keys(values).includes(fieldName));

const FormComponent = ({ selectedPatient, setSelectedPatient, isEdit, children }): ReactElement => {
  const navigation = useNavigation();
  const { customPatientFieldValues, patientAdditionalData, loading } = usePatientAdditionalData(
    selectedPatient?.id,
  );
  const { getSetting } = useSettings();
  const { getTranslation } = useTranslation();

  const createOrUpdateOtherPatientData = useCallback(async (values, patientId) => {
    const customPatientFieldDefinitions = await PatientFieldDefinition.findVisible({
      relations: ['category'],
      order: {
        // Nested ordering only works with typeorm version > 0.3.0
        // category: { name: 'DESC' },
        name: 'DESC',
      },
    });

    if (containsAdditionalData(values)) {
      await PatientAdditionalData.updateForPatient(patientId, values);
    }

    // Update any custom field definitions contained in this form
    const customValuesToUpdate = Object.keys(values).filter((key) =>
      customPatientFieldDefinitions.map(({ id }) => id).includes(key),
    );

    await Promise.all(
      customValuesToUpdate.map((definitionId) =>
        PatientFieldValue.updateOrCreateForPatientAndDefinition(
          patientId,
          definitionId,
          values[definitionId],
        ),
      ),
    );
  }, []);

  const onCreateNewPatient = useCallback(
    async (values, { resetForm }) => {
      // Declared outside the try so the catch can tell whether the patient record
      // was already persisted before a later step failed.
      let newPatient = null;
      try {
        // submit form to server for new patient
        const { dateOfBirth, ...otherValues } = values;
        const pattern = getSetting<string>('patientDisplayIdPattern');
        newPatient = await Patient.createAndSaveOne<Patient>({
          ...otherValues,
          dateOfBirth: formatISO9075(dateOfBirth, { representation: 'date' }),
          displayId: pattern ? generateIdFromPattern(pattern) : generateId(),
        });

        await createOrUpdateOtherPatientData(values, newPatient.id);
        await Patient.markForSync(newPatient.id);

        // Reload instance to get the complete village fields
        // (related fields won't display all info otherwise)
        const reloadedPatient = await Patient.findOne({ where: { id: newPatient.id } });
        setSelectedPatient(reloadedPatient);
        resetForm();
        navigation.navigate(Routes.HomeStack.RegisterPatientStack.NewPatient);
      } catch (error) {
        if (newPatient) {
          // The patient record was already created; a later step (additional data
          // or sync flagging) failed. Do NOT invite a retry — calling
          // createAndSaveOne again would create a duplicate patient.
          Alert.alert(
            getTranslation('patient.register.error.partialSaveTitle', 'Registration incomplete'),
            getTranslation(
              'patient.register.error.partialSaveMessage',
              'The patient record was saved, but registration didn’t fully complete. Open the patient to check their details — do not register them again.',
            ),
          );
        } else {
          // Nothing was persisted, so a retry is safe.
          Alert.alert(
            getTranslation('patient.register.error.createFailedTitle', 'Unable to create patient'),
            getTranslation(
              'patient.register.error.createFailedMessage',
              'Something went wrong while saving the patient. Please try again.',
            ),
          );
        }
      }
    },
    [navigation, setSelectedPatient, createOrUpdateOtherPatientData, getSetting, getTranslation],
  );

  const onEditPatient = useCallback(
    async (values) => {
      // Update patient values (helper function uses .save()
      // so it will mark the record for upload).
      const { dateOfBirth, ...otherValues } = values;
      await Patient.updateValues(selectedPatient.id, {
        dateOfBirth: formatISO9075(dateOfBirth, {
          representation: 'date',
        }),
        ...otherValues,
      });

      await createOrUpdateOtherPatientData(values, selectedPatient.id);
      // Loading the instance is necessary to get all of the fields
      // from the relations that were updated, not just their IDs.
      const editedPatient = await Patient.findOne({ where: { id: selectedPatient.id } });

      // Mark patient for sync and update redux state
      await Patient.markForSync(editedPatient.id);

      setSelectedPatient(editedPatient);

      navigation.goBack();
    },
    [navigation, selectedPatient, setSelectedPatient, createOrUpdateOtherPatientData],
  );

  return loading ? (
    <LoadingScreen />
  ) : (
    <FullView padding={10}>
      <Formik
        onSubmit={isEdit ? onEditPatient : onCreateNewPatient}
        validationSchema={getPatientDetailsValidation(getSetting)}
        initialValues={getPatientInitialValues(
          isEdit,
          selectedPatient,
          patientAdditionalData,
          customPatientFieldValues,
          getSetting,
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

export const PatientPersonalInfoForm =
  compose<React.FC<{ isEdit?: boolean; children?: ReactNode }>>(withPatient)(FormComponent);
