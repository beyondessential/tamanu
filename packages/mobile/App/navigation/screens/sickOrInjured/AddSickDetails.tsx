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
  treatmentNotes: '',
  labTestResults: '',
  medications: '',
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
  KeyboardAvoidingViewStyles: { flex: 1 },
  KeyboardAvoidingViewContainer: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  ScrollView: { flex: 1 },
});

export const AddSickDetailScreen = (): ReactElement => {
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
                  >
                    <SectionHeader h3>INFORMATION</SectionHeader>
                  </StyledView>
                  <StyledView
                    height={screenPercentageToDP(21.87, Orientation.Height)}
                    justifyContent="space-between"
                  >
                    <Field
                      component={TextField}
                      name="treatmentNotes"
                      label="Treatment notes"
                      onFocus={scrollToComponent('treatmentNotes')}
                    />
                    <Field
                      component={TextField}
                      name="labTestResults"
                      label="Lab/Test Results"
                      onFocus={scrollToComponent('labTestResults')}
                    />
                    <Field
                      component={TextField}
                      name="medications"
                      label="Medications"
                      onFocus={scrollToComponent('medications')}
                    />
                  </StyledView>
                  <StyledView
                    marginTop={screenPercentageToDP(2.42, Orientation.Height)}
                    marginBottom={screenPercentageToDP(
                      0.605,
                      Orientation.Height,
                    )}
                  >
                    <SectionHeader h3>COMMENTS</SectionHeader>
                  </StyledView>
                  <Field
                    component={TextField}
                    name="comments"
                    multiline
                    onFocus={scrollToComponent('comments')}
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
