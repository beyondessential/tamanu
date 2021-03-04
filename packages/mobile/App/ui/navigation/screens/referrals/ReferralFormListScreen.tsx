import React, { ReactElement } from 'react';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FullView } from '/styled/common';
import { compose } from 'redux';
import { theme } from '/styled/theme';
import { MenuOptionButton } from '/components/MenuOptionButton';
import { Separator } from '/components/Separator';
import { Routes } from '/helpers/routes';
import { withPatient } from '/containers/Patient';
import { IPatient, SurveyTypes } from '~/types';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

interface ProgramListScreenProps {
  selectedPatient: IPatient;
}

const Screen = ({ selectedPatient }: ProgramListScreenProps): ReactElement => {
  const navigation = useNavigation();

  const [surveys, error] = useBackendEffect(({ models }) => models.Survey.find({
    program: 'program-referral_forms',
  }));

  const onNavigateToSurvey = (survey): any => {
    navigation.navigate(Routes.HomeStack.ProgramStack.ReferralTabs.AddReferralDetails, {
      surveyId: survey.id,
      surveyName: survey.name,
      surveyType: SurveyTypes.Referral,
    })
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
          keyExtractor={(item): string => item.title}
          renderItem={({ item }): ReactElement => (
            <MenuOptionButton
              title={item.name}
              onPress={(): void => onNavigateToSurvey(item)}
              fontWeight={500}
              textColor={theme.colors.TEXT_SUPER_DARK}
            />
          )}
          ItemSeparatorComponent={Separator}
        />
      )}
    </FullView>
  );
};

export const ReferralFormListScreen = compose(withPatient)(Screen);
