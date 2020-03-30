import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { FullView, StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { Field } from '/components/Forms/FormField';
import { Formik } from 'formik';
import { SectionHeader } from '/components/SectionHeader';
import { ScrollView } from 'react-native-gesture-handler';
import { Orientation, screenPercentageToDP, scrollTo } from '/helpers/screen';
import { VerticalPosition } from '../../programs/tabs/ProgramAddDetailsScreen/Container';

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

const calculateVerticalPositions = (fieldList: string[]): VerticalPosition => {
  let verticalOffset = 0;
  return fieldList.reduce<VerticalPosition>((acc, cur, index) => {
    acc[cur] = {
      x: 0,
      y: index === 0 ? 0 : verticalOffset + 30,
    };
    verticalOffset += 65;
    return acc;
  }, {});
};

const styles = StyleSheet.create({
  keyboardAwareStyle: { flex: 1 },
  keyboardAwarecontentContainer: {
    flexGrow: 1,
  },
});

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

  return (
    <StyledSafeAreaView flex={1}>
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingTop={screenPercentageToDP(2.43, Orientation.Height)}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={initialValues}
          onSubmit={(values): void => console.log(values)}
        >
          {({ handleSubmit }): ReactElement => (
            <KeyboardAvoidingView
              behavior="padding"
              style={styles.keyboardAwareStyle}
              contentContainerStyle={styles.keyboardAwarecontentContainer}
            >
              <ScrollView ref={scrollViewRef} scrollToOverflowEnabled>
                <StyledView
                  height={screenPercentageToDP(89.64, Orientation.Height)}
                  justifyContent="space-between"
                  paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
                  paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
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
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  );
};
