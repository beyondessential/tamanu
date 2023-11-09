import { RouteProp, NavigationProp } from '@react-navigation/native';
import { IPatient, IProgram, SurveyTypes } from '~/types';

type SurveyResponseScreenParams = {
  SurveyResponseScreen: {
    program: IProgram;
    surveyId: string;
    latestResponseId: string;
    selectedPatient: IPatient;
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
