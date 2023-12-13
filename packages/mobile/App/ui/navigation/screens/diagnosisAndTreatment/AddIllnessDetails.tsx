import { Formik } from 'formik';
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { compose } from 'redux';

import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { Spacer } from '/components/Spacer';
import { TextField } from '/components/TextField/TextField';
import { FullView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import * as Yup from 'yup';

import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { Certainty, CERTAINTY_OPTIONS, ReferenceDataType } from '~/types';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { CurrentUserField } from '~/ui/components/CurrentUserField/CurrentUserField';
import { Dropdown } from '~/ui/components/Dropdown';
import { withPatient } from '~/ui/containers/Patient';
import { NOTE_RECORD_TYPES, NOTE_TYPES } from '~/ui/helpers/constants';
import { getCurrentDateTimeString } from '~/ui/helpers/date';
import { Routes } from '~/ui/helpers/routes';
import { authUserSelector } from '~/ui/helpers/selectors';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

const IllnessFormSchema = Yup.object().shape({
  diagnosis: Yup.string(),
  certainty: Yup.mixed()
    .oneOf(Object.values(Certainty))
    .when('diagnosis', {
      is: (diagnosis: string) => Boolean(diagnosis),
      then: Yup.mixed().required(),
    }),
  clinicalNote: Yup.string(),
});

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
    navigation.navigate(Routes.HomeStack.HistoryVitalsStack.Index);
  }, []);

  const user = useSelector(authUserSelector);

  const onRecordIllness = useCallback(
    async ({ diagnosis, certainty, clinicalNote }: any): Promise<any> => {
      const encounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
      );

      if (diagnosis) {
        await models.Diagnosis.createAndSaveOne({
          // TODO: support selecting multiple diagnoses and flagging as primary/non primary
          isPrimary: true,
          encounter: encounter.id,
          date: getCurrentDateTimeString(),
          diagnosis,
          certainty,
        });
      }

      if (clinicalNote) {
        await models.Note.createForRecord({
          recordId: encounter.id,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
          noteType: NOTE_TYPES.CLINICAL_MOBILE,
          content: clinicalNote,
          author: user.id,
        });
      }

      navigateToHistory();
    },
    [],
  );

  const icd10Suggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.ICD10,
    },
  });

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik onSubmit={onRecordIllness} initialValues={{}} validationSchema={IllnessFormSchema}>
        {({ handleSubmit, values }): ReactElement => (
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
                <StyledView justifyContent="space-between">
                  <Field
                    component={AutocompleteModalField}
                    label="Select"
                    placeholder="Diagnosis"
                    navigation={navigation}
                    suggester={icd10Suggester}
                    name="diagnosis"
                  />
                  <Spacer height="24px" />
                  <Field
                    component={Dropdown}
                    options={CERTAINTY_OPTIONS}
                    name="certainty"
                    label="Certainty"
                    disabled={!values?.diagnosis}
                  />
                  <Spacer height="24px" />
                  <Field
                    component={TextField}
                    name="clinicalNote"
                    multiline
                    placeholder="Clinical Note"
                  />
                  <Spacer height="24px" />
                  <CurrentUserField name="examiner" label="Recorded By" />
                  <Button
                    marginTop={screenPercentageToDP(1.22, Orientation.Height)}
                    marginBottom={screenPercentageToDP(1.22, Orientation.Height)}
                    backgroundColor={theme.colors.PRIMARY_MAIN}
                    onPress={handleSubmit}
                    buttonText="Submit"
                  />
                </StyledView>
              </ScrollView>
            </KeyboardAvoidingView>
          </FullView>
        )}
      </Formik>
    </FullView>
  );
};

export const AddIllnessScreen = compose(withPatient)(DumbAddIllnessScreen);
