import { WithPatientStoreProps } from '/store/ducks/patient';
import { NavigationProp } from '@react-navigation/native';
import { WithAuthStoreProps } from '../store/ducks/auth';

export interface BaseAppProps extends WithPatientStoreProps, WithAuthStoreProps {
  navigation: NavigationProp<any>;
  route: any;
}
