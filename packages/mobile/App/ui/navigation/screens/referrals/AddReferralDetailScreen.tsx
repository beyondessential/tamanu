import React, { useState, useCallback, ReactElement, useMemo, useEffect, useRef } from 'react';
import { compose } from 'redux';
import { Formik } from 'formik';
import { Certainty, ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/helpers/hooks';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { scrollTo, calculateVerticalPositions } from '/helpers/screen';
import ReferralForm from '../../../components/Forms/ReferralForm';
import { ReferenceData } from '~/models';
import { Suggester } from '~/ui/helpers/suggester';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';

// const initialValues = {
//   referralNumber: null,
//   referringDoctor: null,
//   referredFacility: null,
//   date: null,
//   department: null,
//   urgentPriority: false,
//   diagnosis: null,
//   certainty: null,
//   notes: null,
// };

const DumbAddRefferalDetailScreen = ({ navigation, selectedPatient }): ReactElement => {
  // const scrollViewRef = useRef<any>(null);
  // const verticalPositions = useMemo(
  //   () => calculateVerticalPositions(Object.keys(initialValues), 25),
  //   [],
  // );
  // const scrollToComponent = useCallback(
  //   (fieldName: string) => (): void => {
  //     scrollTo(scrollViewRef, verticalPositions[fieldName]);
  //   },
  //   [scrollViewRef],
  // );

  const { models } = useBackend();
  const onCreateReferral = useCallback(
    async (values): Promise<any> => {
      console.log(values);
      await models.Referral.create({
        patient: selectedPatient.id,
        date: new Date(),
        ...values,
      });

      navigation.navigate(Routes.HomeStack.ReferralTabs.ViewHistory);
    }, [],
  );

  const icd10Suggester = new Suggester(
    ReferenceData,
    {
      where: {
        type: ReferenceDataType.ICD10,
      },
    },
  );

  const renderForm = useCallback(({ handleSubmit }) => (
    <ReferralForm
      // scrollToComponent={scrollToComponent}
      handleSubmit={handleSubmit}
      // scrollViewRef={scrollViewRef}
      icd10Suggester={icd10Suggester}
      navigation={navigation}
    />
  ), []);
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
      // TODO: Figure out why these forms are breaking with no initial values object and fix it.
        initialValues={{}}
        onSubmit={onCreateReferral}
      >
        {renderForm}
      </Formik>
    </FullView>
  );
};

export const AddRefferalDetailScreen = compose(withPatient)(DumbAddRefferalDetailScreen);
