import React, { useMemo, useCallback, useRef, ReactElement } from 'react';
import { compose } from 'redux';
import { FullView, StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { TextField } from '/components/TextField/TextField';
import { DateField } from '/components/DateField/DateField';
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
import { useBackend } from '~/ui/helpers/hooks';
import { withPatient } from '~/ui/containers/Patient';

const initialValues = {
  encounterType: '',
  startDate: '',
  endDate: '',
  reasonForEncounter: '',
};

const DumbCreateEncounterForm = ({ selectedPatient }): ReactElement => {
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
        >
          <SectionHeader h3>CREATE ENCOUNTER</SectionHeader>
          <Field
            component={TextField}
            onFocus={scrollToComponent('encounterType')}
            label="Encounter Type"
            name="encounterType"
          />
          <Field
            component={DateField}
            label="Start Date"
            onFocus={scrollToComponent('startDate')}
            name="startDate"
          />
          <Field
            component={DateField}
            label="End Date"
            onFocus={scrollToComponent('endDate')}
            name="endDate"
          />
          <Field
            component={TextField}
            onFocus={scrollToComponent('reasonForEncounter')}
            label="Reason for Encounter"
            name="reasonForEncounter"
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
  const createEncounter = useCallback((values: any): void => {
    return models.Encounter.create({ ...values, patient: selectedPatient.id });
  }, []);

  return (
    <StyledSafeAreaView flex={1}>
      <FullView
        background={theme.colors.BACKGROUND_GREY}
        paddingBottom={screenPercentageToDP(4.86, Orientation.Height)}
      >
        <Formik
          initialValues={initialValues}
          onSubmit={createEncounter}
        >
          {renderFormFields}
        </Formik>
      </FullView>
    </StyledSafeAreaView>
  )
};

export const CreateEncounterForm = compose(withPatient)(DumbCreateEncounterForm);