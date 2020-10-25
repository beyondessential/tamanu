import React, { useState, useCallback, ReactElement, useMemo, useEffect, useRef } from 'react';
import { Formik } from 'formik';
import { Certainty, ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/helpers/hooks';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { scrollTo, calculateVerticalPositions } from '/helpers/screen';
import ReferralForm from '../../../components/Forms/ReferralForm';

const initialValues = {
  referralNumber: null,
  referringDoctor: null,
  referredFacility: null,
  date: null,
  department: null,
  urgentPriority: false,
  diagnosis: null,
  certainty: null,
  notes: null,
};

export const AddRefferalDetailScreen = (): ReactElement => {
  const scrollViewRef = useRef<any>(null);
  const verticalPositions = useMemo(
    () => calculateVerticalPositions(Object.keys(initialValues), 25),
    [],
  );
  const scrollToComponent = useCallback(
    (fieldName: string) => (): void => {
      scrollTo(scrollViewRef, verticalPositions[fieldName]);
    },
    [scrollViewRef],
  );

  const onCreateReferral = useCallback(
    async (values): Promise<any> => {
      console.log(values);
    }, [],
  );

  const renderForm = useCallback(({ handleSubmit }) => (
    <ReferralForm
      scrollToComponent={scrollToComponent}
      handleSubmit={handleSubmit}
      scrollViewRef={scrollViewRef}
    />
  ), []);
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        initialValues={initialValues}
        onSubmit={onCreateReferral}
      >
        {renderForm}
      </Formik>
    </FullView>
  );
};
