import type { NavigationProp } from '@react-navigation/native';
import type { WithPatientStoreProps } from '/store/ducks/patient';
import type { WithAuthStoreProps } from '../store/ducks/auth';

export interface BaseAppProps extends WithPatientStoreProps, WithAuthStoreProps {
  navigation: NavigationProp<any>;
  route: any;
}
