import React, { ReactElement, useMemo, useRef, useCallback } from 'react';
import { Formik } from 'formik';
import { NavigationProp } from '@react-navigation/native';
import { Field } from '/components/Forms/FormField';
import { SectionHeader } from '/components/SectionHeader';
import { FullView, StyledView } from '/styled/common';
import { TextField } from '/components/TextField/TextField';
import { Button } from '/components/Button';
import { StackHeader } from '/components/StackHeader';
import { theme } from '/styled/theme';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import { screenPercentageToDP, Orientation, scrollTo } from '/helpers/screen';
import { ScrollView } from 'react-native-gesture-handler';
import { VerticalPosition } from '../programs/tabs/ProgramAddDetailsScreen/Container';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { DateField } from '/components/DateField/DateField';
import { joinNames } from '/helpers/user';
import { compose } from 'redux';
import { withPatient } from '/containers/Patient';

const initialValues = {
  staffMember: '',
  deathCertificateNumber: '',
  date: null,
  time: null,
  causeOfDeath: '',
  placeOfDeath: '',
  additionalNotes: '',
};

const calculateVerticalPositions = (fieldList: string[]): VerticalPosition => {
  let verticalOffset = 0;
  return fieldList.reduce<VerticalPosition>((acc, cur, index) => {
    acc[cur] = {
      x: 0,
      y: index === 0 ? 0 : verticalOffset + 40,
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

type AddSickDetailScreenProps = {
  navigation: NavigationProp<any>;
} & BaseAppProps;

const Screen = ({
  navigation,
  selectedPatient,
}: AddSickDetailScreenProps): ReactElement => {
  const scrollViewRef = useRef<any>(null);
  const verticalPositions = useMemo(
    () => calculateVerticalPositions(Object.keys(initialValues)),
    [],
  );

  const navigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const scrollToComponent = useCallback(
    (fieldName: string) => (): void => {
      scrollTo(scrollViewRef, verticalPositions[fieldName]);
    },
    [scrollViewRef],
  );
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StackHeader
        onGoBack={navigateBack}
        subtitle={joinNames(selectedPatient)}
        title="Deceased"
      />
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
                    <SectionHeader h3>CAUSE OF DEATH</SectionHeader>
                  </StyledView>
                  <StyledView
                    height={screenPercentageToDP(45.87, Orientation.Height)}
                    justifyContent="space-between"
                  >
                    <Field
                      component={TextField}
                      name="staffMember"
                      label="Staff Member"
                      onFocus={scrollToComponent('staffMember')}
                    />
                    <Field
                      component={TextField}
                      name="deathCertificateNumber"
                      label="Death Certificate Number"
                      onFocus={scrollToComponent('deathCertificateNumber')}
                    />
                    <Field
                      component={DateField}
                      name="date"
                      label="Date"
                      onFocus={scrollToComponent('date')}
                    />
                    <Field
                      component={DateField}
                      mode="time"
                      name="time"
                      label="Time"
                      onFocus={scrollToComponent('time')}
                    />
                    <Field
                      component={TextField}
                      name="causeOfDeath"
                      label="Cause of Death"
                      onFocus={scrollToComponent('causeOfDeath')}
                    />
                    <Field
                      component={TextField}
                      name="placeOfDeath"
                      label="Place Of Death"
                      onFocus={scrollToComponent('placeOfDeath')}
                    />
                  </StyledView>
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
                    returnKeyType="default"
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

export const AddDeceasedDetailsScreen = compose(withPatient)(Screen);
