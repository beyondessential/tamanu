import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import { ScrollView } from 'react-native-gesture-handler';

import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { FullView, StyledView } from '/styled/common';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { useBackend } from '~/ui/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { ReferenceData } from '~/models/ReferenceData';
import { NumberField } from '~/ui/components/NumberField';
import { authUserSelector } from '~/ui/helpers/selectors';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyles: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  ScrollView: { flex: 1 },
});

export const DumbPrescribeMedicationScreen = ({ selectedPatient, navigation }): ReactElement => {
  const { models } = useBackend();

  const navigateToHistory = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index);
  }, []);

  const user = useSelector(authUserSelector);

  const onPrescribeMedication = useCallback(async (values): Promise<any> => {
    const encounter = await models.Encounter.getOrCreateCurrentEncounter(
      selectedPatient.id,
      user.id,
    );

    await models.Medication.createAndSaveOne({
      encounter: encounter.id,
      date: getCurrentDateTimeString(),
      ...values,
    });

    navigateToHistory();
  }, []);

  const medicationSuggester = new Suggester(ReferenceData, {
    where: {
      type: ReferenceDataType.Drug,
    },
  });

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik onSubmit={onPrescribeMedication} initialValues={{}}>
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
                <SectionHeader h3>MEDICATION</SectionHeader>
                <Field
                  component={AutocompleteModalField}
                  placeholder="Search"
                  navigation={navigation}
                  suggester={medicationSuggester}
                  name="medication"
                />
                <StyledView
                  marginTop={screenPercentageToDP(2.105, Orientation.Height)}
                  height={screenPercentageToDP(21.87, Orientation.Height)}
                  justifyContent="space-between"
                >
                  <SectionHeader h3 marginBottom={screenPercentageToDP(2.105, Orientation.Height)}>
                    INFO
                  </SectionHeader>
                  <Field component={TextField} name="prescription" label="Instruction" />
                  <Field component={TextField} name="indication" label="Indication" />
                  <Field component={TextField} name="route" label="Route" />
                  <Field
                    component={NumberField}
                    name="quantity"
                    label="Quantity (in single units)"
                  />
                </StyledView>
                <StyledView
                  marginTop={screenPercentageToDP(16.42, Orientation.Height)}
                  marginBottom={screenPercentageToDP(0.605, Orientation.Height)}
                >
                  <SectionHeader h3>Prescription notes</SectionHeader>
                </StyledView>
                <Field component={TextField} name="note" multiline />
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

export const PrescribeMedicationScreen = compose(withPatient)(DumbPrescribeMedicationScreen);
