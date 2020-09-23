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

const initialValues = {
  bloodPressure: '',
  weight: '',
  circumference: '',
  sp02: '',
  heartRate: '',
  fev: '',
  cholesterol: '',
  bloodGlucose: '',
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
          <SectionHeader h3>VITAL READINGS</SectionHeader>
          <Field
            component={TextField}
            onFocus={scrollToComponent('bloodPressure')}
            label="Blood Pressure"
            name="bloodPressure"
          />
          <Field
            component={TextField}
            label="Weight"
            onFocus={scrollToComponent('weight')}
            name="weight"
          />
          <Field
            component={TextField}
            onFocus={scrollToComponent('circumference')}
            label="Circumference"
            name="circumference"
          />
          <Field
            component={TextField}
            label="Sp02"
            onFocus={scrollToComponent('sp02')}
            name="sp02"
          />
          <Field
            component={TextField}
            onFocus={scrollToComponent('heartRate')}
            label="Heart Rate"
            name="heartRate"
          />
          <Field
            component={TextField}
            label="F.E.V"
            onFocus={scrollToComponent('fev')}
            name="fev"
          />
          <Field
            component={TextField}
            label="Cholesterol"
            onFocus={scrollToComponent('cholesterol')}
            name="cholesterol"
          />
          <Field
            component={TextField}
            label="Blood Glucose"
            onFocus={scrollToComponent('bloodGlucose')}
            name="bloodGlucose"
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
