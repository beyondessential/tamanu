import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { FullView, StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { Formik } from 'formik';
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

export const AddVitalsScreen = (): ReactElement => {
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
          <SectionHeader h3>VITAL HISTORY</SectionHeader>
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

  return (
    <StyledSafeAreaView flex={1}>
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={initialValues}
          onSubmit={(values): void => console.log(values)}
        >
          {renderFormFields}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};
