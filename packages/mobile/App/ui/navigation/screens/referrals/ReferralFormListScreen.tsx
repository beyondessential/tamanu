import React, { ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView } from '/styled/common';
import { theme } from '/styled/theme';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { SurveyTypes } from '~/types';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useAuth } from '~/ui/contexts/AuthContext';

export const ReferralFormListScreen = (): ReactElement => {
  const navigation = useNavigation();
  const { ability } = useAuth();

  const [surveys, error] = useBackendEffect(({ models }) =>
    models.Survey.find({
      where: {
        surveyType: SurveyTypes.Referral,
      },
      order: {
        name: 'ASC',
      },
    }),
  );

  const filteredSurveys = surveys?.filter(survey => survey.shouldShowInList(ability));

  const onNavigateToSurvey = (survey): any => {
    navigation.navigate(Routes.HomeStack.ReferralStack.ReferralList.AddReferralDetails, {
      surveyId: survey.id,
      surveyName: survey.name,
      surveyType: SurveyTypes.Referral,
    });
  };

  return (
    <FullView>
      {error ? (
        <ErrorScreen error={error} />
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
            <MenuOptionButton title={item.name} onPress={(): void => onNavigateToSurvey(item)} />
          )}
          ItemSeparatorComponent={Separator}
        />
      )}
    </FullView>
  );
};
