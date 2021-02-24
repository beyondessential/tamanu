import React, { useEffect, useState, useCallback } from 'react';
import { Text } from 'react-native-paper';
import { Formik } from 'formik';
import { compose } from 'redux';

import { FullView, StyledScrollView, StyledView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { withPatient } from '~/ui/containers/Patient';
import { useBackend } from '~/ui/hooks';
import { Title } from 'react-native-paper';
import { Button } from '../Button';
import { ReferralQuestion } from "./ReferralQuestion";

const CustomReferralFormComponent = ({ selectedForm, selectedPatient, navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { models } = useBackend();

  const onCreateReferral = useCallback(
    async (values): Promise<any> => {
      const referral = await models.Referral.createAndSaveOne({
        patient: selectedPatient.id,
        formTitle: title, 
        date: new Date(),
      });
      const createAnswerJobs = await Object.entries(values).map(async ([questionId, answer]) => {
        return models.ReferralAnswer.createAndSaveOne({
          referral: referral.id,
          question: questionId,
          answer,
        });
      });

      await Promise.all(createAnswerJobs);
      navigation.navigate(Routes.HomeStack.ReferralTabs.ViewHistory);
    }, [title, selectedPatient],
  );

  useEffect(() => {
    (async (): Promise<void> => {
      setIsLoading(true);
      const form = await models.ReferralForm.getRepository().findOne(selectedForm);
      const formQuestions = await models.ReferralForm.getQuestions(selectedForm);
      setTitle(form.title);
      setQuestions(formQuestions);
      setIsLoading(false);
    })();
  }, [selectedForm]);

  if (isLoading) {
    <FullView>
      <Text>Loading...</Text>
    </FullView>
  }

  return (
    <StyledScrollView>
        <Formik
          initialValues={{}}
          onSubmit={onCreateReferral}
        >
          {({ handleSubmit }): JSX.Element => (
            <FullView padding={12}>
              <Title>{title}</Title>
              {questions.sort((a,b) => b.order - a.order).map(q => (
                <StyledView key={q.id} marginTop={10}>
                  <ReferralQuestion patientData={selectedPatient} data={q} navigation={navigation} />
                </StyledView>
              ))}
              <Button marginTop={12} onPress={handleSubmit} buttonText="Submit" />
            </FullView>
          )}
        </Formik>
    </StyledScrollView>
  );
}

export const CustomReferralForm = compose(withPatient)(CustomReferralFormComponent);