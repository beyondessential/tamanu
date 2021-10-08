import { RouteProp, NavigationProp } from '@react-navigation/native';
import { IProgram } from '~/types';

type SurveyResponseScreenParams = {
  SurveyResponseScreen: {
    program: IProgram;
    surveyId: string;
    latestResponseId: string;
    selectedPatient: { id: string };
    encounterType: string;
    surveyType: string;
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
