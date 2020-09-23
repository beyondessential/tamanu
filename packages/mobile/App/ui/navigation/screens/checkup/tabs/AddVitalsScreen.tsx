import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { compose } from 'redux';
import { FullView, StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { Formik } from 'formik';
import { useBackend } from '~/ui/helpers/hooks';
import { withPatient } from '~/ui/containers/Patient';
import { SectionHeader } from '/components/SectionHeader';
import {
  Orientation,
  screenPercentageToDP,
  scrollTo,
  calculateVerticalPositions,
} from '/helpers/screen';
import { FormScreenView } from '/components/Forms/FormScreenView';
import { NumberField } from '~/ui/components/NumberField';
import { Dropdown } from '~/ui/components/Dropdown';
import { AVPUType } from '~/types';

const initialValues = {
  weight: 0,
  height: 0,
  sbp: 0,
  dbp: 0,
  heartRate: 0,
  respiratoryRate: 0,
  temperature: 0,
  svO2: 0,
  avpu: 0,
  comments: '',
};

export const DumbAddVitalsScreen = ({ selectedPatient }): ReactElement => {
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

  const renderFormFields = useCallback(
    ({ handleSubmit }): ReactElement => (
      <FormScreenView scrollViewRef={scrollViewRef}>
        <StyledView
          height={screenPercentageToDP(89.64, Orientation.Height)}
          justifyContent="space-between"
        >
          <SectionHeader h3>VITALS READINGS</SectionHeader>
          <Field
            component={NumberField}
            label="Weight (kg)"
            onFocus={scrollToComponent('weight')}
            name="weight"
          />
          <Field
            component={NumberField}
            label="Height (cm)"
            onFocus={scrollToComponent('height')}
            name="height"
          />
          <Field
            component={NumberField}
            onFocus={scrollToComponent('sbp')}
            label="sbp"
            name="sbp"
          />
          <Field
            component={NumberField}
            label="dbp"
            onFocus={scrollToComponent('dbp')}
            name="dbp"
          />
          <Field
            component={NumberField}
            onFocus={scrollToComponent('heartRate')}
            label="Heart Rate"
            name="heartRate"
          />
          <Field
            component={NumberField}
            label="Respiratory Rate"
            onFocus={scrollToComponent('respiratoryRate')}
            name="respiratoryRate"
          />
          <Field
            component={NumberField}
            label="Temperature (ºC)"
            onFocus={scrollToComponent('temperature')}
            name="temperature"
          />
          <Field
            component={NumberField}
            label="SvO2 (%)"
            onFocus={scrollToComponent('svO2')}
            name="svO2"
          />
          <Field
            component={Dropdown}
            options={Object.values(AVPUType).map((t) => ({ value: t, label: t }))}
            label="AVPU"
            onFocus={scrollToComponent('avpu')}
            name="avpu"
          />
          <SectionHeader h3>COMMENTS</SectionHeader>
          <Field
            component={TextField}
            name="comments"
            onFocus={scrollToComponent('comments')}
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

  const { models } = useBackend();
  const recordVitals = useCallback(
    (values: any): void => models.Vitals.create({
      ...values,
      patient: selectedPatient.id,
      date: Date.now(),
    }), [],
  );

  return (
    <StyledSafeAreaView flex={1}>
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={initialValues}
          onSubmit={recordVitals}
        >
          {renderFormFields}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const AddVitalsScreen = compose(withPatient)(DumbAddVitalsScreen);
