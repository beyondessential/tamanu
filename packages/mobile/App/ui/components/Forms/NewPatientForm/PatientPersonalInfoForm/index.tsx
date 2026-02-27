import React, { ReactElement, ReactNode, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { generateId, generateIdFromPattern } from '@tamanu/utils';
import { compose } from 'redux';
import { Formik } from 'formik';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
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
      // submit form to server for new patient
      const { dateOfBirth, ...otherValues } = values;
      const pattern = getSetting<string>('patientDisplayIdPattern');  
      const newPatient = await Patient.createAndSaveOne<Patient>({
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
    },
    [navigation, setSelectedPatient, createOrUpdateOtherPatientData, getSetting],
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

      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
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
