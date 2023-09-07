import { RouteProp, NavigationProp } from '@react-navigation/native';
import { IProgram, SurveyTypes } from '~/types';

type SurveyResponseScreenParams = {
  SurveyResponseScreen: {
    program: IProgram;
    surveyId: string;
    latestResponseId: string;
    selectedPatient: {
      id: string;
      firstName?: string;
      lastName?: string;
    };
    encounterType: string;
    surveyType: SurveyTypes;
  };
};

type SurveyResponseScreenRouteProps = RouteProp<
SurveyResponseScreenParams,
'SurveyResponseScreen'
>;

export type SurveyResponseScreenProps = {
  navigation: NavigationProp<any>;
  route: SurveyResponseScreenRouteProps;
};
