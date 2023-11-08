import React, { useCallback, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';
import { Dimensions, Text } from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { CenterView, FullView, RowView } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { SurveyResponseScreenProps } from '/interfaces/Screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '/helpers/routes';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';

import { useBackend, useBackendEffect } from '~/ui/hooks';
import { SurveyTypes, GenericFormValues } from '~/types';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { authUserSelector } from '~/ui/helpers/selectors';
import { joinNames } from '~/ui/helpers/user';
import { StackHeader } from '~/ui/components/StackHeader';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { Button } from '~/ui/components/Button';
import { useCurrentScreen } from '~/ui/hooks/useCurrentScreen';

const buttonSharedStyles = {
  width: screenPercentageToDP('25', Orientation.Width),
  height: screenPercentageToDP('4.6', Orientation.Height),
  fontSize: 12,
  fontWeight: 500,
};

export const SurveyResponseScreen = ({ route }: SurveyResponseScreenProps): ReactElement => {
  const { surveyId, selectedPatient, surveyType } = route.params;
  const isReferral = surveyType === SurveyTypes.Referral;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();
  const { currentScreenIndex, onNavigatePrevious, setCurrentScreenIndex } = useCurrentScreen();

  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [survey, surveyError, isSurveyLoading] = useBackendEffect(
    ({ models }) => models.Survey.getRepository().findOne(surveyId),
  );

  const [components, componentsError, areComponentsLoading] = useBackendEffect(
    () => survey && survey.getComponents(),
    [survey],
  );

  const [patientAdditionalData, padError, isPadLoading] = useBackendEffect(
    ({ models }) => models.PatientAdditionalData.getRepository().findOne({
      patient: selectedPatient.id,
    }),
    [selectedPatient.id],
  );

  const user = useSelector(authUserSelector);

  const { models } = useBackend();
  const onSubmit = useCallback(
    async (values: GenericFormValues) => {
      const model = isReferral ? models.Referral : models.SurveyResponse;
      const response = await model.submit(
        selectedPatientId,
        user.id,
        {
          surveyId,
          components,
          surveyType,
          encounterReason: `Survey response for ${survey.name}`,
        },
        values,
        setNote,
      );

      if (!response) return;
      if (isReferral) {
        navigation.navigate(Routes.HomeStack.ReferralStack.ViewHistory.Index, {
          surveyId: surveyId,
          latestResponseId: response.id,
        });
        return;
      } else {
        navigation.navigate(
          Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.ViewHistory,
          {
            selectedPatient,
            latestResponseId: response.id,
          },
        );
        return;
      }
    },
    [survey, components],
  );

  const closeModalCallback = useCallback(async () => {
    setShowModal(false);
  }, []);
  const openExitModal = useCallback(async () => {
    setShowModal(true);
  }, []);
  const onExit = () => {
    closeModalCallback();
    if (isReferral) {
      navigation.navigate(Routes.HomeStack.ReferralStack.Index);
      return;
    }
    navigation.navigate(Routes.HomeStack.ProgramStack.ProgramTabs.Index);
  };
  const onGoBack = () => {
    if (currentScreenIndex > 0) {
      onNavigatePrevious();
    } else {
      openExitModal();
    }
  };

  const error = surveyError || componentsError || padError;
  // due to how useBackendEffect works we need to stay in the loading state for queries which depend
  // on other data, like the query for components
  const isLoading =
    !survey || !components || isSurveyLoading || areComponentsLoading || isPadLoading;
  if (error) {
    return <ErrorScreen error={error} />;
  }
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary resetRoute={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails}>
      <FullView>
        <StackHeader
          title={survey.name}
          subtitle={joinNames(selectedPatient)}
          onGoBack={onGoBack}
        />
        <SurveyForm
          patient={selectedPatient}
          patientAdditionalData={patientAdditionalData}
          note={note}
          components={components}
          onSubmit={onSubmit}
          onCancel={openExitModal}
          setCurrentScreenIndex={setCurrentScreenIndex}
          currentScreenIndex={currentScreenIndex}
          onGoBack={onGoBack}
        />

        <Modal
          isVisible={showModal}
          onBackdropPress={closeModalCallback}
          backdropOpacity={1}
          backdropColor="#a5a5a5"
          deviceHeight={Dimensions.get('window').height}
        >
          <CenterView
            style={{
              backgroundColor: theme.colors.BACKGROUND_GREY,
              borderRadius: 5,
              maxHeight: screenPercentageToDP('24', Orientation.Height),
              width: screenPercentageToDP('66', Orientation.Width),
              padding: 20,
              marginLeft: screenPercentageToDP('10', Orientation.Width),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.BLACK,
                fontWeight: 'bold',
                marginBottom: 10,
              }}
            >
              Exit form?
            </Text>
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                color: theme.colors.BLACK,
              }}
            >
              Are you sure you want to exit the form? You will lose any information currently
              entered.
            </Text>
            <RowView flexDirection="row" justifyContent="space-between" width="95%" marginTop={10}>
              <Button
                outline
                borderColor={theme.colors.MAIN_SUPER_DARK}
                borderWidth={0.1}
                buttonText="Stay on page"
                onPress={closeModalCallback}
                {...buttonSharedStyles}
              />
              <Button
                buttonText="Exit"
                onPress={onExit}
                {...buttonSharedStyles}
                backgroundColor={theme.colors.PRIMARY_MAIN}
              />
            </RowView>
          </CenterView>
        </Modal>
      </FullView>
    </ErrorBoundary>
  );
};
