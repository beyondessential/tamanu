import React, { ReactElement } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { ScrollView } from 'react-native-gesture-handler';

import { SubmitButton } from '/components/Forms/SubmitButton';
import { Field } from '~/ui/components/Forms/FormField';
import { TextField } from '~/ui/components/TextField/TextField';
import { IPatient } from '~/types';
import { StackHeader } from '~/ui/components/StackHeader'
import { FullView } from '~/ui/styled/common';
import { joinNames } from '~/ui/helpers/user';

export type AddPatientIssueScreenProps = {
  onNavigateBack: () => void;
  onRecordPatientIssue: (fields: { note: string }) => Promise<void>;
  selectedPatient: IPatient;
};

const PatientIssueFormSchema = Yup.object().shape({
  note: Yup.string().required(),
});

const styles = StyleSheet.create({
  KeyboardAvoidingView: { flex: 1 },
  ScrollView: { flex: 1 },
  ScrollViewContentContainer: { padding: 20 },
});

export const Screen = ({
  onNavigateBack,
  onRecordPatientIssue,
  selectedPatient,
}: AddPatientIssueScreenProps): ReactElement<AddPatientIssueScreenProps> => {
  return (
    <FullView>
      <StackHeader
        title="Add patient issue"
        subtitle={joinNames(selectedPatient)}
        onGoBack={onNavigateBack}
      />
      <Formik
        onSubmit={onRecordPatientIssue}
        initialValues={{ note: '' }}
        validationSchema={PatientIssueFormSchema}
      >
        {({ handleSubmit }): ReactElement => (
          <KeyboardAvoidingView
            style={styles.KeyboardAvoidingView}
            behavior="padding"
          >
            <ScrollView
              style={styles.ScrollView}
              contentContainerStyle={styles.ScrollViewContentContainer}
            >
              <Field
                component={TextField}
                multiline
                autoCapitalize="sentences"
                autoFocus={true}
                label="Note"
                name="note"
              />
              <SubmitButton
                marginTop={10}
                onPress={handleSubmit}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Formik>
    </FullView>
  );
};
