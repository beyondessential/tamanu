import { subject } from '@casl/ability';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import React, { type ReactElement, useCallback, useState } from 'react';
import { Dimensions, Text } from 'react-native';
import Modal from 'react-native-modal';
import { useSelector } from 'react-redux';
import { Database } from '~/infra/db';
import { type GenericFormValues, type IPatientAdditionalData, SurveyTypes } from '~/types';
import { Button } from '~/ui/components/Button';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { StackHeader } from '~/ui/components/StackHeader';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useAuth } from '~/ui/contexts/AuthContext';
import { resetToProgramSurveyHistory, resetToReferralHistory } from '~/ui/helpers/navigators';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { authUserSelector } from '~/ui/helpers/selectors';
import { joinNames } from '~/ui/helpers/user';
import { patientKeys, surveyKeys } from '~/ui/hooks/queries/queryKeys';
import usePatientAdditionalDataRecordQuery from '~/ui/hooks/queries/usePatientAdditionalDataRecordQuery';
import { useCurrentScreen } from '~/ui/hooks/useCurrentScreen';
import useSurveySubmitMutation from '~/ui/hooks/useSurveySubmitMutation';
import type { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import type { PatientStateProps } from '~/ui/store/ducks/patient';
import { CenterView, FullView, RowView } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';
import { Routes } from '/helpers/routes';
import type { SurveyResponseScreenProps } from '/interfaces/Screens/ProgramsStack/SurveyResponseScreen';

const buttonSharedStyles = {
  width: screenPercentageToDP('25', Orientation.Width),
  height: screenPercentageToDP('4.6', Orientation.Height),
  fontSize: 12,
  fontWeight: 500,
};

export const SurveyResponseScreen = ({ route }: SurveyResponseScreenProps): ReactElement => {
  const { surveyId, surveyType } = route.params;
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const isReferral = surveyType === SurveyTypes.Referral;
  const selectedPatientId = selectedPatient.id;
  const navigation = useNavigation();
  const { ability } = useAuth();
  const canReadRegistration = ability.can('read', 'PatientProgramRegistration');
  const { currentScreenIndex, onNavigatePrevious, setCurrentScreenIndex } = useCurrentScreen();

  const [showModal, setShowModal] = useState(false);

  const {
    data: survey,
    error: surveyError,
    isPending: isSurveyLoading,
  } = useQuery({
    queryKey: surveyKeys.detail(surveyId),
    queryFn: () =>
      Database.models.Survey.getRepository().findOne({
        where: { id: surveyId },
      }),
  });

  const {
    data: components,
    error: componentsError,
    isPending: areComponentsLoading,
  } = useQuery({
    queryKey: surveyKeys.components(surveyId),
    queryFn: () => survey.getComponents({ includeAllVitals: false }),
    enabled: Boolean(survey),
  });

  const {
    data: patientAdditionalData,
    error: padError,
    isPending: isPadLoading,
  } = usePatientAdditionalDataRecordQuery(selectedPatient.id);

  const user = useSelector(authUserSelector);

  const {
    data: patientProgramRegistration,
    error: pprError,
    isPending: isPprLoading,
    // `canReadRegistration` is based on the signed-in user; encoded in query key as `user.id`
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
  } = useQuery({
    queryKey: [
      ...patientKeys.registrations(selectedPatient.id),
      'recent',
      { programId: survey?.programId, userId: user?.id },
    ],
    queryFn: async () => {
      if (canReadRegistration === false) return null;
      const patientProgramRegistry = await Database.models.PatientProgramRegistration.getRecentOne(
        survey?.programId,
        selectedPatient.id,
      );

      if (!patientProgramRegistry) {
        return null;
      }

      const canReadProgramRegistry = ability.can(
        'read',
        subject('ProgramRegistry', { id: patientProgramRegistry.programRegistryId }),
      );

      return canReadProgramRegistry ? patientProgramRegistry : null;
    },
    enabled: survey != null,
  });

  const { mutateAsync: submitSurveyResponse } = useSurveySubmitMutation({ surveyType });

  const onSubmit = useCallback(
    async (values: GenericFormValues) => {
      const response = await submitSurveyResponse({
        components,
        patientId: selectedPatientId,
        surveyId,
        values,
      });

      if (!response) return;
      if (isReferral) {
        resetToReferralHistory(navigation);
      } else {
        resetToProgramSurveyHistory(navigation, response.id);
      }
    },
    [components, isReferral, navigation, selectedPatientId, submitSurveyResponse, surveyId],
  );

  const closeModalCallback = useCallback(async () => {
    setShowModal(false);
  }, []);
  const openExitModal = useCallback(async () => {
    setShowModal(true);
  }, []);
  const onExit = () => {
    closeModalCallback();
    navigation.goBack();
  };
  const onGoBack = () => {
    if (currentScreenIndex > 0) {
      onNavigatePrevious();
    } else {
      openExitModal();
    }
  };

  const error = surveyError || componentsError || padError || pprError;
  const isLoading =
    !survey ||
    !components ||
    isSurveyLoading ||
    areComponentsLoading ||
    isPadLoading ||
    isPprLoading;
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
          // PatientAdditionalData and IPatientAdditionalData disagree on
          // patient.village.visibilityStatus (string vs enum), a pre-existing model typing quirk
          patientAdditionalData={patientAdditionalData as unknown as IPatientAdditionalData}
          patientProgramRegistration={patientProgramRegistration}
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
              <TranslatedText stringId="program.survey.exit.heading" fallback="Exit form?" />
            </Text>
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                color: theme.colors.BLACK,
              }}
            >
              <TranslatedText
                stringId="program.survey.exit.text"
                fallback="Are you sure you want to exit the form? You will lose any information currently entered."
              />
            </Text>
            <RowView flexDirection="row" justifyContent="space-between" width="95%" marginTop={10}>
              <Button
                outline
                borderColor={theme.colors.MAIN_SUPER_DARK}
                borderWidth={0.1}
                buttonText={
                  <TranslatedText
                    stringId="program.survey.action.stayOnPage"
                    fallback="Stay on page"
                  />
                }
                onPress={closeModalCallback}
                {...buttonSharedStyles}
              />
              <Button
                buttonText={<TranslatedText stringId="general.action.exit" fallback="Exit" />}
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
