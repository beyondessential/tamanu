import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { compose } from 'redux';
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

export const DumbAddVitalsScreen = ({ selectedPatient, navigation }): ReactElement => {
  const renderFormFields = useCallback(
    ({ handleSubmit, errors }): ReactElement => (
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

  const validationSchema
    = Yup.object().shape({
      weight: Yup.number(),
      height: Yup.number(),
      sbp: Yup.number(),
      dbp: Yup.number(),
      heartRate: Yup.number(),
      respiratoryRate: Yup.number(),
      temperature: Yup.number(),
      svO2: Yup.number(),
      avpu: Yup.string(), // AVPUType
      comment: Yup.string(),
    });

  const requiresOneOfFields = [
    'weight',
    'height',
    'sbp',
    'dbp',
    'heartRate',
    'respiratoryRate',
    'temperature',
    'svO2',
    'avpu',
  ];

  const validate = (values: object): object => {
    const errors = {};

    const requiredFieldFilter = (val: string) => requiresOneOfFields.includes(val);
    const valueFields = Object.keys(values).filter(requiredFieldFilter);

    if (valueFields.length === 0) {
      errors['form'] = 'At least one vital must be recorded.';
    }

    return errors;
  };

  const navigateToHistory = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: Routes.HomeStack.CheckUpStack.CheckUpTabs.ViewHistory }],
    })
  }, []);

  const { models } = useBackend();
  const recordVitals = useCallback(
    async (values: any): Promise<any> => {
      const encounter = await models.Encounter.getOrCreateCurrentEncounter(
        selectedPatient.id,
        { reasonForEncounter: values.comments },
      );

      await models.Vitals.createAndSaveOne({
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
          validate={validate}
          validationSchema={validationSchema}
          onSubmit={recordVitals}
        >
          {renderFormFields}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const AddVitalsScreen = compose(withPatient)(DumbAddVitalsScreen);
