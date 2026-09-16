import type { RouteProp } from '@react-navigation/native';

export type IndexStackProps = {
  route: RouteProp<{ params: { signedOutFromInactivity: boolean } }, 'params'>;
};
