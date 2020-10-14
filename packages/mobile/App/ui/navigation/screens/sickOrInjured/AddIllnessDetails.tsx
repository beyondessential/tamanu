import React, { ReactElement, useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { compose } from 'redux';
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
} from '/helpers/screen';
import { useBackend } from '~/ui/helpers/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '/helpers/routes';

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyles: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  ScrollView: { flex: 1 },
});

export const DumbAddIllnessScreen = ({ selectedPatient, navigation }): ReactElement => {
  const { models } = useBackend();

  const navigateToHistory = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HistoryVitalsStack.name);
  }, []);

  const recordIllness = useCallback(
    async (values: any): Promise<any> => {
      await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        {
          startDate: new Date(),
          ...values,
        },
      );

      navigateToHistory();
    }, [],
  );

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        onSubmit={recordIllness}
        initialValues={{}}
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
                    name="examiner"
                    label="Examiner"
                  />
                  <Field
                    component={TextField}
                    name="labRequest"
                    label="Lab/Test Results"
                  />
                  <Field
                    component={TextField}
                    name="medication"
                    label="Medications"
                  />
                </StyledView>
                <StyledView
                  marginTop={screenPercentageToDP(7.42, Orientation.Height)}
                  marginBottom={screenPercentageToDP(
                    0.605,
                    Orientation.Height,
                  )}
                >
                  <SectionHeader h3>Treatment notes</SectionHeader>
                </StyledView>
                <Field
                  component={TextField}
                  name="resonForEncounter"
                  multiline
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

export const AddIllnessScreen = compose(withPatient)(DumbAddIllnessScreen);
