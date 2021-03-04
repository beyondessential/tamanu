import React, { ReactElement, useCallback } from 'react';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { compose } from 'redux';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { joinNames } from '/helpers/user';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { List } from 'react-native-paper';
import { format } from 'date-fns';
import { ReferralFormStack } from './ReferralFormStack';
import { StyledScrollView } from '~/ui/styled/common';

const Tabs = createTopTabNavigator();

type ReferralTabsProps = {
  navigation: NavigationProp<any>;
} & BaseAppProps;

const DumbReferralHistoryScreen = ({ selectedPatient }): JSX.Element => {
  const isFocused = useIsFocused();
  const [data, error] = useBackendEffect(
    ({ models }) => models.Referral.getForPatient(selectedPatient.id),
    [isFocused],
    );

  if (error) return <ErrorScreen error={error} />;
  return (
    <StyledScrollView>
      <List.Section>
        {data && data.map(({ surveyResponse }) => {
          const { survey, answers, startTime } = surveyResponse;

          return (
            <List.Accordion
              title={`${survey.name} (${format(startTime, 'dd-MM-yyy')})`}
              left={props => <List.Icon {...props} icon="clipboard-plus-outline" />}>
              {answers.map(answer =>
                <List.Item key={answer.id} title={answer.dataElement.defaultText} description={answer.body} />
              )}
            </List.Accordion>
          )
        })}
      </List.Section>
    </StyledScrollView>
  );
};

const ReferralHistoryScreen = compose(withPatient)(DumbReferralHistoryScreen);

const TabNavigator = ({
  navigation,
  selectedPatient,
}: ReferralTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <>
      <StackHeader
        title="Referrals"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          initialParams={{
            selectedPatient
          }}
          options={{
            title: 'REFER PATIENT',
          }}
          name={Routes.HomeStack.ProgramStack.ReferralTabs.AddReferralDetails}
          component={ReferralFormStack}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW REFERRALS',
          }}
          name={Routes.HomeStack.ProgramStack.ReferralTabs.ViewHistory}
          component={ReferralHistoryScreen}
        />
      </Tabs.Navigator>
    </>
  );
};

export const ReferralTabs = compose(withPatient)(TabNavigator);
