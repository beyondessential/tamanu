import { FullView } from '/styled/common';
import { useNavigation } from '@react-navigation/native';
import { formatISO9075, parseISO } from 'date-fns';
import { Formik } from 'formik';
import React, { ReactElement, useCallback } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { Patient } from '~/models/Patient';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { withPatient } from '~/ui/containers/Patient';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { allAdditionalDataFields } from '~/ui/helpers/additionalData';
import { generateId, getConfiguredPatientAdditionalDataFields } from '~/ui/helpers/patient';
import { Routes } from '~/ui/helpers/routes';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { getInitialAdditionalValues } from '../../PatientAdditionalDataForm/helpers';
import { PatientAdditionalDataFields } from '../../PatientAdditionalDataForm/PatientAdditionalDataFields';
import { KeyInformationSection } from './KeyInformationSection';
import { LocationDetailsSection } from './LocationDetailsSection';
import { NameSection } from './NameSection';
import { getPatientDetailsValidation } from './patientDetailsValidationSchema';
import { SubmitSection } from './SubmitSection';

export type FormSection = {
  scrollToField: (fieldName: string) => () => void;
};

const styles = StyleSheet.create({
  KeyboardAvoidingView: { flex: 1 },
  ScrollView: { flex: 1 },
  ScrollViewContentContainer: { padding: 20 },
});

const getPatientInitialValues = (isEdit: boolean, patient, patientAdditionalData, getBool): {} => {
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
    allAdditionalDataFields,
    true,
    getBool,
  );
  const initialPatientAdditionalDataValues = getInitialAdditionalValues(
    patientAdditionalData,
    requiredPADFields,
  );

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
  };

  return Object.fromEntries(
    Object.entries(initialPatientValues).filter(([_, value]) => value != null),
  );
};

const containsAdditionalData = values =>
  allAdditionalDataFields.some(fieldName => Object.keys(values).includes(fieldName));

export const FormComponent = ({ selectedPatient, setSelectedPatient, isEdit }): ReactElement => {
  const navigation = useNavigation();
  const { patientAdditionalData, loading } = usePatientAdditionalData(selectedPatient?.id);
  const onCreateNewPatient = useCallback(async values => {
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

    await Patient.markForSync(newPatient.id);

    // Reload instance to get the complete village fields
    // (related fields won't display all info otherwise)
    const reloadedPatient = await Patient.findOne(newPatient.id);
    setSelectedPatient(reloadedPatient);
    navigation.navigate(Routes.HomeStack.RegisterPatientStack.NewPatient);
  }, []);

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

      // Loading the instance is necessary to get all of the fields
      // from the relations that were updated, not just their IDs.
      const editedPatient = await Patient.findOne(selectedPatient.id);

      // Mark patient for sync and update redux state
      await Patient.markForSync(editedPatient.id);

      setSelectedPatient(editedPatient);

      // Navigate back to patient details
      navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
    },
    [navigation],
  );

  const { getBool, getString } = useLocalisation();

  return loading ? <LoadingScreen /> : (
    <FullView padding={10}>
      <Formik
        onSubmit={isEdit ? onEditPatient : onCreateNewPatient}
        validationSchema={getPatientDetailsValidation(getBool, getString)}
        initialValues={getPatientInitialValues(
          isEdit,
          selectedPatient,
          patientAdditionalData,
          getBool,
        )}
      >
        {({ handleSubmit }): JSX.Element => (
          <KeyboardAvoidingView style={styles.KeyboardAvoidingView} behavior="padding">
            <ScrollView
              style={styles.ScrollView}
              contentContainerStyle={styles.ScrollViewContentContainer}
            >
              <NameSection />
              <KeyInformationSection />
              <LocationDetailsSection />
              <PatientAdditionalDataFields fields={allAdditionalDataFields} showMandatory />
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
