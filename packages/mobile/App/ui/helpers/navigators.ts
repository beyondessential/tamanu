import { CommonActions, NavigationProp } from '@react-navigation/native';

import { Routes } from './routes';

export const noTabComponent = (): null => null;

export const noSwipeGestureOnNavigator = {
  gestureEnabled: false,
};

// Navigate on a delay in order to wait for navigation to this screen to complete
export const navigateAfterTimeout = (navigation, route): void => {
  setTimeout(
    () => navigation.navigate(route),
    30,
  );
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
