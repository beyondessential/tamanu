import React, { useCallback, ReactElement, useContext, useEffect, useState } from 'react';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import { authUserSelector } from '/helpers/selectors';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/hooks';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import ReferralForm from '../../../components/Forms/ReferralForm';
import { ReferenceData, User } from '~/models';
import { OptionType, Suggester } from '~/ui/helpers/suggester';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';

const DumbAddRefferalDetailScreen = ({ navigation, selectedPatient }): ReactElement => {
  const { models } = useBackend();
  const user = useSelector(authUserSelector);

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

  const practitionerSuggester = new Suggester(
    User,
    { column: 'displayName' },
    ({ displayName, id }): OptionType => ({ label: displayName, value: id }),
  );

  const renderForm = useCallback(({ handleSubmit }) => (
    <ReferralForm
      handleSubmit={handleSubmit}
      icd10Suggester={icd10Suggester}
      practitionerSuggester={practitionerSuggester}
      navigation={navigation}
      loggedInUser={user}
    />
  ), []);
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        initialValues={{
          practitioner: user.id,
        }}
        onSubmit={onCreateReferral}
      >
        {renderForm}
      </Formik>
    </FullView>
  );
};

export const AddRefferalDetailScreen = compose(withPatient)(DumbAddRefferalDetailScreen);
