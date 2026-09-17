import { CommonActions, type NavigationProp } from '@react-navigation/native';

import { Routes } from './routes';

export const noSwipeGestureOnNavigator = {
  gestureEnabled: false,
};

// Navigate on a delay in order to wait for navigation to this screen to complete
export const navigateAfterTimeout = (navigation, route): void => {
  setTimeout(() => navigation.navigate(route), 30);
};

/** Reset ProgramStack to the View history tab after submitting a program survey. */
export const resetToProgramSurveyHistory = (
  navigation: NavigationProp<any>,
  latestResponseId: string,
): void => {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: Routes.HomeStack.ProgramStack.ProgramTabs.Index,
          state: {
            routes: [
              {
                name: Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.ViewHistory,
                params: { latestResponseId },
              },
            ],
            index: 0,
          },
        },
      ],
    }),
  );
};

const getVaccineStackNavigation = (
  navigation: NavigationProp<any>,
): NavigationProp<any> | undefined => {
  let current: NavigationProp<any> | undefined = navigation;
  while (current) {
    if (
      current
        .getState()
        .routes?.some(route => route.name === Routes.HomeStack.VaccineStack.VaccineTabs.Index)
    ) {
      return current;
    }
    current = current.getParent();
  }
  return undefined;
};

/**
 * Pop back to the vaccine table without resetting the active category tab. The table
 * refreshes via query invalidation from the vaccine mutation, not navigation params.
 */
export const returnToVaccineTable = (navigation: NavigationProp<any>): void => {
  const stackNavigation = getVaccineStackNavigation(navigation);

  if (!stackNavigation) {
    navigation.goBack();
    return;
  }

  stackNavigation.goBack();
};

/** Reset ReferralStack to the View referrals tab after submitting a referral form. */
export const resetToReferralHistory = (navigation: NavigationProp<any>): void => {
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: Routes.HomeStack.ReferralStack.View,
          state: {
            routes: [{ name: Routes.HomeStack.ReferralStack.ViewHistory.Index }],
            index: 0,
          },
        },
      ],
    }),
  );
};
