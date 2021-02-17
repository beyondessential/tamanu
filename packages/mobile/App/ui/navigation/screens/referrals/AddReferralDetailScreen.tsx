import React, { useCallback, ReactElement, useContext, useEffect, useState } from 'react';
import { compose } from 'redux';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';

import { authUserSelector } from '/helpers/selectors';
import { ReferenceDataType, Certainty } from '~/types';
import { useBackend } from '~/ui/hooks';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import ReferralForm from '../../../components/Forms/ReferralForm';
import { User } from '~/models/User';
import { ReferenceData } from '~/models/ReferenceData';
import { OptionType, Suggester } from '~/ui/helpers/suggester';
import { withPatient } from '~/ui/containers/Patient';
import { Routes } from '~/ui/helpers/routes';

const ReferralFormSchema = Yup.object().shape({
  referredFacility: Yup.string().required(),
  referredDepartment: Yup.string().required(),
  diagnosis: Yup.string().required(),
  certainty: Yup.mixed().oneOf(Object.values(Certainty)).required(),
  notes: Yup.string().required(),
});

const DumbAddRefferalDetailScreen = ({ navigation, selectedPatient }): ReactElement => {
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [referralForm, setReferralForm] = useState(null);
  const { models } = useBackend();
  const user = useSelector(authUserSelector);

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(selectedPatient.id);
      setSurveyResponses(responses);
    })();
  }, [selectedPatient]);

  const onCreateReferral = useCallback(
    async (values): Promise<any> => {
      await models.Referral.createAndSaveOne({
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
      surveyResponses={surveyResponses}
    />
  ), [surveyResponses, user]);
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <Formik
        initialValues={{
          practitioner: user.id,
        }}
        onSubmit={onCreateReferral}
        validationSchema={ReferralFormSchema}
      >
        {renderForm}
      </Formik>
    </FullView>
  );
};

export const AddRefferalDetailScreen = compose(withPatient)(DumbAddRefferalDetailScreen);
