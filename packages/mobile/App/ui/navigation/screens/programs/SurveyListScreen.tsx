import React, { type ReactElement, useCallback } from 'react';
import { FlatList } from 'react-native';
import { type RouteProp, useNavigation } from '@react-navigation/native';
import { FullView, StyledText, StyledView } from '/styled/common';
import { compose } from 'redux';
import { theme } from '/styled/theme';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { withPatient } from '/containers/Patient';
import { type IPatient, SurveyTypes } from '~/types';
import { joinNames } from '/helpers/user';
import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { surveyKeys } from '~/ui/hooks/queries/queryKeys';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import type { Survey } from '~/models/Survey';
import { useAuth } from '~/ui/contexts/AuthContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { VisibilityStatus } from '~/visibilityStatuses';
import { getProgramSurveysWithFormVisibility } from '~/utils/getProgramSurveysWithFormVisibility';

type SurveyListScreenParams = {
  SurveyListScreen: {
    programId: string;
    programName: string;
  };
};

type SurveyListScreenRouteProps = RouteProp<SurveyListScreenParams, 'SurveyListScreen'>;

type SurveyListScreenProps = {
  route: SurveyListScreenRouteProps;
  selectedPatient: IPatient;
};

const Screen = ({ selectedPatient, route }: SurveyListScreenProps): ReactElement => {
  const navigation = useNavigation();
  const { programId, programName } = route.params;
  const { ability, user } = useAuth();

  const { data: filteredSurveys, error, isPending: isLoading } =
    // `ability` is based on signed-in user anyway; encoded in query key as `user.id`
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    useQuery({
      queryKey: surveyKeys.list({
        patientId: selectedPatient?.id,
        programId,
        userId: user?.id,
      }),
      queryFn: async () => {
        const { models } = Database;
        const allSurveys = await models.Survey.find({
          relations: ['program'],
          where: {
            surveyType: SurveyTypes.Programs,
            program: { id: programId },
            visibilityStatus: VisibilityStatus.Current,
          },
          order: { name: 'ASC' },
        });

        const filteredByAbility = allSurveys.filter((s: Survey) => s.shouldShowInList(ability));

        return getProgramSurveysWithFormVisibility(models, filteredByAbility, selectedPatient?.id);
      },
    });

  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToSurvey = (survey: Survey): void => {
    navigation.navigate(Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails, {
      surveyId: survey.id,
      surveyType: survey.surveyType,
    });
  };

  return (
    <FullView>
      <StackHeader title={joinNames(selectedPatient)} onGoBack={goBack} />
      {error ? (
        <ErrorScreen error={error} />
      ) : (
        <FullView>
          <StyledView
            paddingLeft={screenPercentageToDP('4.86', Orientation.Width)}
            paddingTop={screenPercentageToDP('1.76', Orientation.Height)}
            paddingBottom={screenPercentageToDP('1.76', Orientation.Height)}
            minHeight={screenPercentageToDP('7.7', Orientation.Height)}
          >
            <StyledText
              fontWeight={500}
              color={theme.colors.TEXT_SUPER_DARK}
              fontSize={screenPercentageToDP('2.7', Orientation.Height)}
            >
              {programName}
            </StyledText>
          </StyledView>
          <Separator />
          {isLoading || !filteredSurveys ? (
            <LoadingScreen />
          ) : (
            <FlatList
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                backgroundColor: theme.colors.BACKGROUND_GREY,
                paddingTop: 5,
              }}
              showsVerticalScrollIndicator={false}
              data={filteredSurveys}
              keyExtractor={(item): string => item.id}
              renderItem={({ item }): ReactElement => (
                <MenuOptionButton
                  key={item.id}
                  title={item.name}
                  onPress={(): void => onNavigateToSurvey(item)}
                  textProps={{ fontWeight: 400, color: theme.colors.TEXT_SUPER_DARK }}
                  arrowForwardIconProps={{ size: 16, fill: theme.colors.TEXT_DARK }}
                />
              )}
              ItemSeparatorComponent={() => <Separator paddingLeft="5%" width="95%" />}
            />
          )}
        </FullView>
      )}
    </FullView>
  );
};

export const SurveyListScreen = compose(withPatient)(Screen);
