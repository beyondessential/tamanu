import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { compose } from 'redux';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { joinNames } from '/helpers/user';
import { AddRefferalDetailScreen } from '../screens/referrals/AddReferralDetailScreen';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { List } from 'react-native-paper';
import { format } from 'date-fns';

const Tabs = createTopTabNavigator();

type ReferralTabsProps = {
  navigation: NavigationProp<any>;
} & BaseAppProps;

const DumbReferralHistoryScreen = ({ selectedPatient }): JSX.Element => {
  const isFocused = useIsFocused();
  const { models } = useBackend();
  const [data, error] = useBackendEffect(
    ({ models }) => models.Referral.getForPatient(selectedPatient.id),
    [isFocused],
  );
    
  if (error) return <ErrorScreen error={error} />;
  return (
    <List.Section>
      {data && data.map(({ formTitle , date, answers }) => {
        return (
          <List.Accordion
            title={`${formTitle} (${format(date, 'dd-MM-yyy')})`}
            left={props => <List.Icon {...props} icon="clipboard-plus-outline" />}>
            {answers.map(answer =>
              <List.Item title={answer.question.question} description={answer.answer} />
            )}
          </List.Accordion>
        )
      })}
    </List.Section>
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
          options={{
            title: 'REFER PATIENT',
          }}
          name={Routes.HomeStack.ReferralTabs.AddReferralDetails}
          component={AddRefferalDetailScreen}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW REFERRALS',
          }}
          name={Routes.HomeStack.ReferralTabs.ViewHistory}
          component={ReferralHistoryScreen}
        />
      </Tabs.Navigator>
    </>
  );
};

export const ReferralTabs = compose(withPatient)(TabNavigator);
