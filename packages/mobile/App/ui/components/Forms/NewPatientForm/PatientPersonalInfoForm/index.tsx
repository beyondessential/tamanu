import React, { ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { compose } from 'redux';
import { Formik } from 'formik';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import * as Yup from 'yup';
import { FullView } from '/styled/common';
import { formatISO9075, parseISO } from 'date-fns';
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

  return {
    firstName,
    middleName,
    lastName,
    culturalName,
    dateOfBirth: parseISO(dateOfBirth),
    email,
    sex,
    villageId,
  };
};

export const FormComponent = ({ selectedPatient, setSelectedPatient, isEdit }): ReactElement => {
  const navigation = useNavigation();
  const onCreateNewPatient = useCallback(async values => {
    // submit form to server for new patient
    const { dateOfBirth, ...otherValues } = values;
    const newPatient = await Patient.createAndSaveOne({
      ...otherValues,
      dateOfBirth: formatISO9075(dateOfBirth),
      displayId: generateId(),
    });
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

  return (
    <FullView padding={10}>
      <Formik
        onSubmit={isEdit ? onEditPatient : onCreateNewPatient}
        validationSchema={Yup.object().shape({
          firstName: Yup.string().required(),
          middleName: Yup.string().nullable(),
          lastName: Yup.string().required(),
          culturalName: Yup.string().nullable(),
          dateOfBirth: Yup.date().required(),
          email: Yup.string().nullable(),
          sex: Yup.string().required(),
          village: Yup.string().nullable(),
        })}
        initialValues={getInitialValues(isEdit, selectedPatient)}
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
