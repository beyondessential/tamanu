import React, { ReactElement, useMemo, useRef, useCallback } from 'react';
import { Formik } from 'formik';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { scrollTo, calculateVerticalPositions } from '/helpers/screen';
import ReferralForm from '../../../components/Forms/ReferralForm';

const initialValues = {
  referralNumber: '',
  referringDoctor: '',
  referredFacility: '',
  date: null,
  department: '',
  urgentPriority: false,
  diagnosis: '',
  certainty: null,
  notes: '',
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
        onSubmit={(values): void => console.log(values)}
      >
        {renderForm}
      </Formik>
    </FullView>
  );
};
