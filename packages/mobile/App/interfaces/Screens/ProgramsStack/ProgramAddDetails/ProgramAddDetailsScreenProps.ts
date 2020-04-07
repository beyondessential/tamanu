import { ProgramModel } from '/root/App/models/Program';
import { RouteProp, NavigationProp } from '@react-navigation/native';

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
