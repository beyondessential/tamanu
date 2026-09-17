import type { RouteProp } from '@react-navigation/native';

export interface IndexStackProps {
  route: RouteProp<{ params: { signedOutFromInactivity: boolean } }, 'params'>;
}
