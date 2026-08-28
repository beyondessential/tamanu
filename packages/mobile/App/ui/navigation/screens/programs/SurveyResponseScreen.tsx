import React, { ReactElement, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Dimensions, Text } from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { subject } from '@casl/ability';

import { CenterView, FullView, RowView } from '~/ui/styled/common';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { SurveyResponseScreenProps } from '/interfaces/Screens/ProgramsStack/SurveyResponseScreen';
import { Routes } from '/helpers/routes';
import { SurveyForm } from '~/ui/components/Forms/SurveyForm';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import {
  patientKeys,
  registrationKeys,
  reportKeys,
  surveyKeys,
} from '~/ui/hooks/queries/queryKeys';
import usePatientAdditionalDataRecordQuery from '~/ui/hooks/queries/usePatientAdditionalDataRecordQuery';
import { useBackend } from '~/ui/hooks';
import { GenericFormValues, IPatientAdditionalData, SurveyTypes } from '~/types';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { authUserSelector } from '~/ui/helpers/selectors';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { PatientStateProps } from '~/ui/store/ducks/patient';
import { joinNames } from '~/ui/helpers/user';
import { StackHeader } from '~/ui/components/StackHeader';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { Button } from '~/ui/components/Button';
import { useCurrentScreen } from '~/ui/hooks/useCurrentScreen';
import { useAuth } from '~/ui/contexts/AuthContext';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { resetToProgramSurveyHistory, resetToReferralHistory } from '~/ui/helpers/navigators';

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

  const { models } = useBackend();
  const queryClient = useQueryClient();
  const { mutateAsync: submitSurveyResponse } = useMutation({
    // Referral.submit and SurveyResponse.submit return different record types; the
    // caller only relies on the shared id field.
    mutationFn: (values: GenericFormValues): Promise<{ id: string } | null> => {
      const model = isReferral ? models.Referral : models.SurveyResponse;
      return model.submit(
        selectedPatientId,
        user.id,
        {
          surveyId,
          components,
          surveyType,
          encounterReason: 'Form response',
        },
        values,
      );
    },
    onSuccess: response => {
      if (!response) return;
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(selectedPatientId) });
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });
      queryClient.invalidateQueries({ queryKey: reportKeys.all });
    },
  });

  const onSubmit = useCallback(
    async (values: GenericFormValues) => {
      const response = await submitSurveyResponse(values);

      if (!response) return;
      if (isReferral) {
        resetToReferralHistory(navigation);
      } else {
        resetToProgramSurveyHistory(navigation, response.id);
      }
    },
    [submitSurveyResponse, isReferral, navigation],
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
                fallback="Are you sure you want to exit the form? You will lose any information currently
              entered."
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
