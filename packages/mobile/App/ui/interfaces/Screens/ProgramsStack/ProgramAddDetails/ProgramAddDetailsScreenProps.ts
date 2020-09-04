import { RouteProp, NavigationProp } from '@react-navigation/native';
import { IProgram } from '~/types';

type ProgramAddDetailsScreenParams = {
  ProgramAddDetailsScreen: {
    program: IProgram;
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
