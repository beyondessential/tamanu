import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { Formik } from 'formik';
import { compose } from 'redux';
import { FullView, StyledView, StyledSafeAreaView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
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

export const DumbAddVitalsScreen = ({ selectedPatient, navigation }): ReactElement => {
  const renderFormFields = useCallback(
    ({ handleSubmit }): ReactElement => (
      <FormScreenView>
        <StyledView
          height={screenPercentageToDP(89.64, Orientation.Height)}
          justifyContent="space-between"
        >
          <SectionHeader h3>VITALS READINGS</SectionHeader>
          <Field
            component={NumberField}
            label="Weight (kg)"
            name="weight"
          />
          <Field
            component={NumberField}
            label="Height (cm)"
            name="height"
          />
          <Field
            component={NumberField}
            label="sbp"
            name="sbp"
          />
          <Field
            component={NumberField}
            label="dbp"
            name="dbp"
          />
          <Field
            component={NumberField}
            label="Heart Rate"
            name="heartRate"
          />
          <Field
            component={NumberField}
            label="Respiratory Rate"
            name="respiratoryRate"
          />
          <Field
            component={NumberField}
            label="Temperature (ºC)"
            name="temperature"
          />
          <Field
            component={NumberField}
            label="SvO2 (%)"
            name="svO2"
          />
          <Field
            component={Dropdown}
            options={Object.values(AVPUType).map((t) => ({ value: t, label: t }))}
            label="AVPU"
            name="avpu"
          />
          <SectionHeader h3>COMMENTS</SectionHeader>
          <Field
            component={TextField}
            name="comments"
            label="comments"
            multiline
          />
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

  const navigateToHistory = useCallback(() => {
    navigation.navigate(Routes.HomeStack.CheckUpStack.CheckUpTabs.ViewHistory);
  }, []);

  const { models } = useBackend();
  const recordVitals = useCallback(
    async (values: any): Promise<any> => {
      const encounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        { reasonForEncounter: values.comments },
      );

      await models.Vitals.create({
        ...values,
        encounter: encounter.id,
        date: new Date(),
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
          onSubmit={recordVitals}
        >
          {renderFormFields}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const AddVitalsScreen = compose(withPatient)(DumbAddVitalsScreen);
