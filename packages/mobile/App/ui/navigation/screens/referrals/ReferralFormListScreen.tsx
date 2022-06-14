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

export const ReferralFormListScreen = (): ReactElement => {
  const navigation = useNavigation();

  const [surveys, error] = useBackendEffect(({ models }) => models.Survey.find({
    surveyType: SurveyTypes.Referral,
  }));

  const onNavigateToSurvey = (survey): any => {
    navigation.navigate(
      Routes.HomeStack.ReferralStack.ReferralList.AddReferralDetails,
      {
        surveyId: survey.id,
        surveyName: survey.name,
        surveyType: SurveyTypes.Referral,
      },
    );
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
          }}
          showsVerticalScrollIndicator={false}
          data={surveys}
          keyExtractor={(item): string => item.id}
          renderItem={({ item }): ReactElement => (
            <MenuOptionButton
              title={item.name}
              onPress={(): void => onNavigateToSurvey(item)}
              fontWeight={500}
            />
          )}
          ItemSeparatorComponent={Separator}
        />
      )}
    </FullView>
  );
};
