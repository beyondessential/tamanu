import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { FullView, StyledView, StyledSafeAreaView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { FormValidationMessage } from '/components/Forms/FormValidationMessage';
import { useBackend } from '~/ui/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { SectionHeader } from '/components/SectionHeader';
import {
  Orientation,
  screenPercentageToDP,
} from '/helpers/screen';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { NumberField } from '~/ui/components/NumberField';
import { Dropdown } from '~/ui/components/Dropdown';
import { AVPUType } from '~/types';
import { authUserSelector } from '~/ui/helpers/selectors';
import { Text } from 'react-native';
import { DateField } from '~/ui/components/DateField/DateField';
import { CurrentUserField } from '~/ui/components/CurrentUserField/CurrentUserField';
import { SymbolDisplayPartKind } from 'typescript';
import { ID } from '~/types/ID';

const LabRequestNumberField = () => {
  return (
    <Field
      component={NumberField}
      label="Lab Request Number"
      name="displayId"
    />);
}

interface LabRequestFormData {
  displayId: ID,
  requestedDate: Date,
  requestedBy: string,
  urgent: boolean,
  specimenAttached: boolean,
  labTestCategory: string,
}

export const DumbAddLabRequestScreen = ({ selectedPatient, navigation }): ReactElement => {
  const renderFormFields = useCallback(
    ({ handleSubmit, errors }): ReactElement => (
      <FormScreenView>
        <StyledView
          height={screenPercentageToDP(89.64, Orientation.Height)}
          justifyContent="space-between"
        >
          <LabRequestNumberField />
          <SectionHeader h3>DETAILS</SectionHeader>
          <StyledView
            justifyContent="space-between"
          >
            <Field
              component={DateField}
              label="Date"
              name="requestedDate"
            />
            <Field
              component={CurrentUserField}
              label="Requested by"
              name="requestedBy"
            />
            <Field
              component={TextField} // Binary Field
              label="Urgent?"
              name="urgent"
            />
          </StyledView>
          <SectionHeader h3>SPECIMEN</SectionHeader>
          <Field
            component={TextField}
            label="comments"
            name="comments"
          />
          <SectionHeader h3>LAB REQUEST TYPE</SectionHeader>
          <Field
            component={Dropdown}
            label="Type"
            name="labRequestType"
            options={[ {label: 'hi', value: 'hi'}]}
          />
          <Text>{'All tests for this lab request type will be requested (UI not built yet)'}</Text>
          <FormValidationMessage message={errors.form} />
          <Button
            marginTop={20}
            backgroundColor={theme.colors.PRIMARY_MAIN}
            buttonText="Submit"
            onPress={handleSubmit}
          />
        </StyledView>
      </FormScreenView>
    ),
    [],
  );


  const validationSchema = undefined; // TODO:


  const navigateToHistory = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory }],
    })
  }, []);

  const user = useSelector(authUserSelector);

  const { models } = useBackend();

  const recordLabRequest = useCallback(
    async (values: LabRequestFormData): Promise<void> => {
      const encounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        user.id,
        { reasonForEncounter: 'lab request from mobile' },
      );

      await models.LabRequest.createWithTests({
        ...values,
        category: encounter.id,
        encounter: encounter.id,
        labTestTypeIds: [],
        // dateRecorded: new Date(),
      });

      navigateToHistory();
    }, [],
  );

  return (
    <StyledSafeAreaView flex={1}>
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={{}}
          // validate={validate}
          validationSchema={validationSchema}
          onSubmit={recordLabRequest}
        >
          {renderFormFields}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const AddLabRequestScreen = compose(withPatient)(DumbAddLabRequestScreen);
