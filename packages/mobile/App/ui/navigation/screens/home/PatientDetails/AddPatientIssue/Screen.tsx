import React, { ReactElement } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { ScrollView } from 'react-native-gesture-handler';

import { Field } from '~/ui/components/Forms/FormField';
import { TextField } from '~/ui/components/TextField/TextField';
import { Button } from '~/ui/components/Button';
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
  KeyboardAvoidingView: { display: 'flex', flex: 1 },
  ScrollView: { display: 'flex', flex: 1 },
  ScrollViewContentContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
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
              <Button
                onPress={handleSubmit}
                buttonText="Submit"
              />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Formik>
    </FullView>
  );
};
