import { RouteProp, NavigationProp } from '@react-navigation/native';
import { ProgramModel } from '../../../../models/Program';

type ProgramAddDetailsScreenParams = {
  ProgramAddDetailsScreen: {
    program: ProgramModel;
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
