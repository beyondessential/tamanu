import React, { ReactElement, useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { Formik } from 'formik';
import { ScrollView } from 'react-native-gesture-handler';
import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { FullView, StyledView } from '/styled/common';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import {
  screenPercentageToDP,
  Orientation,
  scrollTo,
  calculateVerticalPositions,
} from '/helpers/screen';
import { DiagnosesAutocompleteField } from '~/ui/components/DiagnosesAutocompleteField';

const initialValues = {
  treatmentNotes: '',
  labTestResults: '',
  medications: '',
  diagnosis: '',
  comments: '',
};

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyles: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  ScrollView: { flex: 1 },
});

export const AddSickDetailScreen = (): ReactElement => {
  const scrollViewRef = useRef<any>(null);
  const verticalPositions = useMemo(
    () => calculateVerticalPositions(Object.keys(initialValues)),
    [],
  );
  const scrollToComponent = useCallback(
    (fieldName: string) => (): void => {
      scrollTo(scrollViewRef, verticalPositions[fieldName]);
    },
    [scrollViewRef],
  );

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        initialValues={initialValues}
        onSubmit={(values): void => console.log(values)}
      >
        {({ handleSubmit }): ReactElement => (
          <FullView
            background={theme.colors.BACKGROUND_GREY}
            paddingRight={20}
            paddingLeft={20}
            paddingTop={20}
          >
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.KeyboardAvoidingViewStyles}
              contentContainerStyle={styles.KeyboardAvoidingViewContainer}
            >
              <ScrollView
                style={styles.ScrollView}
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                scrollToOverflowEnabled
                overScrollMode="always"
              >
                <StyledView
                  marginBottom={screenPercentageToDP(
                    0.605,
                    Orientation.Height,
                  )}
                >
                  <SectionHeader h3>INFORMATION</SectionHeader>
                </StyledView>
                <StyledView
                  height={screenPercentageToDP(21.87, Orientation.Height)}
                  justifyContent="space-between"
                >
                  <Field
                    component={TextField}
                    name="treatmentNotes"
                    label="Treatment notes"
                    onFocus={scrollToComponent('treatmentNotes')}
                  />
                  <Field
                    component={TextField}
                    name="labTestResults"
                    label="Lab/Test Results"
                    onFocus={scrollToComponent('labTestResults')}
                  />
                  <Field
                    component={TextField}
                    name="medications"
                    label="Medications"
                    onFocus={scrollToComponent('medications')}
                  />
                  <Field
                    component={DiagnosesAutocompleteField}
                    name="diagnosis"
                    label="Diagnosis"
                    onFocus={scrollToComponent('diagnosis')}
                  />
                </StyledView>
                <StyledView
                  marginTop={screenPercentageToDP(7.42, Orientation.Height)}
                  marginBottom={screenPercentageToDP(
                    0.605,
                    Orientation.Height,
                  )}
                >
                  <SectionHeader h3>COMMENTS</SectionHeader>
                </StyledView>
                <Field
                  component={TextField}
                  name="comments"
                  multiline
                  onFocus={scrollToComponent('comments')}
                />
                <Button
                  marginTop={screenPercentageToDP(1.22, Orientation.Height)}
                  backgroundColor={theme.colors.PRIMARY_MAIN}
                  onPress={handleSubmit}
                  buttonText="Submit"
                />
              </ScrollView>
            </KeyboardAvoidingView>
          </FullView>
        )}
      </Formik>
    </FullView>
  );
};
