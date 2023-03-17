import React, { ReactElement, useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import { ScrollView } from 'react-native-gesture-handler';
// import { InputLabel } from '@material-ui/core';

import { Field } from '/components/Forms/FormField';
import { Spacer } from '/components/Spacer';
import { SectionHeader } from '/components/SectionHeader';
import { FullView, StyledView } from '/styled/common';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet, Picker, Text } from 'react-native';
import * as Yup from 'yup';

import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { useBackend } from '~/ui/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { CERTAINTY_OPTIONS, Certainty, ReferenceDataType, NoteRecordType, NoteType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { Dropdown } from '~/ui/components/Dropdown';
import { authUserSelector } from '~/ui/helpers/selectors';
import { CurrentUserField } from '~/ui/components/CurrentUserField/CurrentUserField';
import { getCurrentDateTimeString } from '~/ui/helpers/date';

const IllnessFormSchema = Yup.object().shape({
  diagnosis: Yup.string(),
  certainty: Yup.mixed()
    .oneOf(Object.values(Certainty))
    .when('diagnosis', {
      is: (diagnosis: string) => !!diagnosis,
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

// const ClinicalNoteField = () => (
//   <Field component={TextField} name="clinicalNote" multiline />
// )

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
        await models.NotePage.createForRecord({
          recordId: encounter.id,
          recordType: NoteRecordType.ENCOUNTER,
          noteType: NoteType.CLINICAL_MOBILE,
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
                <StyledView>
                  <SectionHeader h3>INFORMATION</SectionHeader>
                </StyledView>
                <StyledView justifyContent="space-between">
                  <Field
                    component={AutocompleteModalField}
                    placeholder="Search diagnoses"
                    navigation={navigation}
                    suggester={icd10Suggester}
                    modalRoute={Routes.Autocomplete.Modal}
                    name="diagnosis"
                  />
                  <Spacer height='24px'/>
                  <Field
                    component={Dropdown}
                    options={CERTAINTY_OPTIONS}
                    name="certainty"
                    label="Certainty"
                    disabled={!values?.diagnosis}
                  />
                  <StyledView
                    marginTop={screenPercentageToDP(1.42, Orientation.Height)}
                    marginBottom={screenPercentageToDP(
                      0.605,
                      Orientation.Height,
                    )}
                  >
                    <SectionHeader h3>Prescription notes</SectionHeader>
                  </StyledView>
                  <Field component={TextField} name="clinicalNote" multiline placeholder="Clinical Note" fontSize="14px"/>
                  {/* //   <InputLabel shrink>
                  //     Clinical Note 
                  //   </InputLabel>
                  // } /> */}
                  <Spacer height='24px'/>
                  <CurrentUserField name="examiner" label="Recorded By" />
                  <Button
                    marginTop={screenPercentageToDP(1.22, Orientation.Height)}
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
