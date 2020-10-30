import React, { useCallback, ReactElement } from 'react';
import { compose } from 'redux';
import { Formik } from 'formik';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import ReferralForm from '../../../components/Forms/ReferralForm';
import { ReferenceData } from '~/models';
import { Suggester } from '~/ui/helpers/suggester';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';

const DumbAddRefferalDetailScreen = ({ navigation, selectedPatient }): ReactElement => {
  const { models } = useBackend();
  const onCreateReferral = useCallback(
    async (values): Promise<any> => {
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
      handleSubmit={handleSubmit}
      icd10Suggester={icd10Suggester}
      navigation={navigation}
    />
  ), []);
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        initialValues={{}}
        onSubmit={onCreateReferral}
      >
        {renderForm}
      </Formik>
    </FullView>
  );
};

export const AddRefferalDetailScreen = compose(withPatient)(DumbAddRefferalDetailScreen);
