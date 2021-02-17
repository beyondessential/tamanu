import React, { useCallback, ReactElement, useEffect, useState } from 'react';
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
import { Dropdown } from '~/ui/components/Dropdown';
import { CustomReferralForm } from '~/ui/components/CustomReferralForm';

const ReferralFormSchema = Yup.object().shape({
  referredFacility: Yup.string().required(),
  referredDepartment: Yup.string().required(),
  diagnosis: Yup.string().required(),
  certainty: Yup.mixed().oneOf(Object.values(Certainty)).required(),
  notes: Yup.string().required(),
});

const DumbAddRefferalDetailScreen = ({ navigation, selectedPatient }): ReactElement => {
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [referralForms, setReferralForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const { models } = useBackend();
  const user = useSelector(authUserSelector);

  useEffect(() => {
    (async (): Promise<void> => {
      const responses = await models.SurveyResponse.getForPatient(selectedPatient.id);
      const forms = await models.ReferralForm.find({});
      setReferralForms([{ label: 'Basic referral', value: 'default' }, ...forms.map(f => ({ label: f.title, value: f.id }))]);
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

  const onSelectForm = useCallback(formId => setSelectedForm(formId), []);

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

  const renderForm = useCallback(() => {
    if (selectedForm === 'default') {
      return (
        <Formik
          initialValues={{
            practitioner: user.id,
          }}
          onSubmit={onCreateReferral}
          validationSchema={ReferralFormSchema}
        >
          {({ handleSubmit }): JSX.Element => (
            <FullView>
              <ReferralForm
                handleSubmit={handleSubmit}
                icd10Suggester={icd10Suggester}
                practitionerSuggester={practitionerSuggester}
                navigation={navigation}
                loggedInUser={user}
                surveyResponses={surveyResponses}
              />
            </FullView>
          )}
        </Formik>
      );
    }
    
    return (
      <CustomReferralForm selectedForm={selectedForm} />
    );
  }, [surveyResponses, user, selectedForm]);
  
  if (!selectedForm) return (
    <FullView padding={20} background={theme.colors.BACKGROUND_GREY}>
      <Dropdown
        value={selectedForm}
        onChange={onSelectForm}
        options={referralForms}
        label="Select a referral form template"
      />
    </FullView>
  );
  
  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      {renderForm()}
    </FullView>
  );
};

export const AddRefferalDetailScreen = compose(withPatient)(DumbAddRefferalDetailScreen);
