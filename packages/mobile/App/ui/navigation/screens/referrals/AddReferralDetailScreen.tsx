import React, { ReactElement, useMemo, useRef, useCallback } from 'react';
import { Formik } from 'formik';
import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { FullView, StyledView } from '/styled/common';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { screenPercentageToDP, Orientation, scrollTo } from '/helpers/screen';
import { ScrollView } from 'react-native-gesture-handler';
import { VerticalPosition } from '../programs/tabs/ProgramAddDetailsScreen/Container';

const initialValues = {
  additionalNotes: '',
};

const calculateVerticalPositions = (fieldList: string[]): VerticalPosition => {
  return fieldList.reduce<VerticalPosition>((acc, cur, index) => {
    acc[cur] = {
      x: 0,
      y: 100,
    };
    return acc;
  }, {});
};

const styles = StyleSheet.create({
  KeyboardAvoidingViewStyles: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  ScrollView: { flex: 1 },
});

export const AddRefferalDetailScreen = (): ReactElement => {
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
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        initialValues={initialValues}
        onSubmit={(values): void => console.log(values)}
      >
        {({ handleSubmit }): ReactElement => {
          return (
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
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator={false}
                  scrollToOverflowEnabled
                  overScrollMode="always"
                >
                  <StyledView
                    marginBottom={screenPercentageToDP(
                      0.605,
                      Orientation.Height,
                    )}
                  />
                  <StyledView
                    height={screenPercentageToDP(21.87, Orientation.Height)}
                  />
                  <StyledView
                    marginTop={screenPercentageToDP(2.42, Orientation.Height)}
                    marginBottom={screenPercentageToDP(
                      0.605,
                      Orientation.Height,
                    )}
                  >
                    <SectionHeader h3>ADDITIONAL NOTES</SectionHeader>
                  </StyledView>
                  <Field
                    component={TextField}
                    name="additionalNotes"
                    multiline
                    hints={false}
                    onFocus={scrollToComponent('additionalNotes')}
                  />
                  <Button
                    marginTop={screenPercentageToDP(1.22, Orientation.Height)}
                    backgroundColor={theme.colors.PRIMARY_MAIN}
                    onPress={handleSubmit}
                    buttonText="Submit"
                  />
                </ScrollView>
              </KeyboardAvoidingView>
            </FullView>
          );
        }}
      </Formik>
    </FullView>
  );
};
