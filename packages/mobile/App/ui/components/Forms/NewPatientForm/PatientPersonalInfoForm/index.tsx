import React, { useCallback, ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { compose } from 'redux';
import { Formik } from 'formik';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as Yup from 'yup';
import { FullView } from '/styled/common';
import { NameSection } from './NameSection';
import { KeyInformationSection } from './KeyInformationSection';
import { LocationDetailsSection } from './LocationDetailsSection';
import { SubmitSection } from './SubmitSection';
import { generateId } from '~/ui/helpers/patient';
import { Patient } from '~/models/Patient';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';

export type FormSection = {
  scrollToField: (fieldName: string) => () => void;
};

const styles = StyleSheet.create({
  KeyboardAvoidingView: { flex: 1 },
  ScrollView: { flex: 1 },
  ScrollViewContentContainer: { padding: 20 },
});

const getInitialValues = (isEdit: boolean, patient): {} => {
  if (!isEdit || !patient) {
    return {};
  }

  // Only grab the fields that will get validated
  const {
    firstName,
    middleName,
    lastName,
    culturalName,
    dateOfBirth,
    sex,
    villageId,
  } = patient;

  return {
    firstName,
    middleName,
    lastName,
    culturalName,
    dateOfBirth: new Date(dateOfBirth),
    sex,
    villageId,
  };
};

export const FormComponent = ({
  selectedPatient,
  setSelectedPatient,
  isEdit,
}): ReactElement => {
  const navigation = useNavigation();
  const onCreateNewPatient = useCallback(async (values) => {
    // submit form to server for new patient
    const newPatient = await Patient.createAndSaveOne({
      ...values,
      displayId: generateId(),
      markedForSync: true,
      markedForUpload: true,
    });
    setSelectedPatient(newPatient);
    navigation.navigate(Routes.HomeStack.RegisterPatientStack.NewPatient);
  }, []);

  const onEditPatient = useCallback(async (values) => {
    const editedPatient = await Patient.findOne(selectedPatient.id);

    // Update each value used on the form
    Object.entries(values).forEach(([key, value]) => {
      editedPatient[key] = value;
    });

    // Mark patient for sync, save and update redux state
    await Patient.markForSync(editedPatient.id);
    await editedPatient.save();
    setSelectedPatient(editedPatient);

    // Navigate back to patient details
    navigation.navigate(Routes.HomeStack.PatientDetailsStack.Index);
  }, [navigation]);

  return (
    <FullView padding={10}>
      <Formik
        onSubmit={isEdit ? onEditPatient : onCreateNewPatient}
        validationSchema={Yup.object().shape({
          firstName: Yup.string().required(),
          middleName: Yup.string(),
          lastName: Yup.string().required(),
          culturalName: Yup.string(),
          dateOfBirth: Yup.date().required(),
          sex: Yup.string().required(),
          village: Yup.string(),
        })}
        initialValues={getInitialValues(isEdit, selectedPatient)}
      >
        {({ handleSubmit }): JSX.Element => (
          <KeyboardAvoidingView
            style={styles.KeyboardAvoidingView}
            behavior="padding"
          >
            <ScrollView
              style={styles.ScrollView}
              contentContainerStyle={styles.ScrollViewContentContainer}
            >
              <NameSection />
              <KeyInformationSection />
              <LocationDetailsSection />
              <SubmitSection onPress={handleSubmit} isEdit={isEdit} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Formik>
    </FullView>
  );
};

export const PatientPersonalInfoForm = compose(withPatient)(FormComponent);
