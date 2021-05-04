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

export const FormComponent = ({
  setSelectedPatient,
}): ReactElement => {
  const navigation = useNavigation();
  const onSubmitForm = useCallback(async (values) => {
    // submit form to server for new patient
    const newPatient = await Patient.createAndSaveOne({
      ...values,
      displayId: generateId(),
      markedForSync: true,
    });
    setSelectedPatient(newPatient);
    navigation.navigate(Routes.HomeStack.RegisterPatientStack.NewPatient);
  }, []);

  return (
    <FullView padding={10}>
      <Formik
        onSubmit={onSubmitForm}
        validationSchema={Yup.object().shape({
          firstName: Yup.string().required(),
          middleName: Yup.string(),
          lastName: Yup.string().required(),
          culturalName: Yup.string(),
          dateOfBirth: Yup.date().required(),
          sex: Yup.string().required(),
          village: Yup.string(),
        })}
        initialValues={{}}
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
              <SubmitSection onPress={handleSubmit} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Formik>
    </FullView>
  );
};

export const PatientPersonalInfoForm = compose(withPatient)(FormComponent);
