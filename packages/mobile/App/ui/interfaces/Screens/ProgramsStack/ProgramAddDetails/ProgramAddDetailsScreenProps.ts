import { RouteProp, NavigationProp } from '@react-navigation/native';
import { IProgram } from '~/types';

type ProgramAddDetailsScreenParams = {
  ProgramAddDetailsScreen: {
    program: IProgram;
    surveyId: string;
    latestResponseId: string;
    selectedPatient: { id: string };
  };
};

type ProgramAddDetailsScreenRouteProps = RouteProp<
  ProgramAddDetailsScreenParams,
  'ProgramAddDetailsScreen'
>;

export type ProgramAddDetailsScreenProps = {
  navigation: NavigationProp<any>;
  route: ProgramAddDetailsScreenRouteProps;
};
