import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

export interface SignInProps {
  navigation: StackNavigationProp<any>;
  route: RouteProp<{ params: { signedOutFromInactivity: boolean } }, 'params'>;
}
