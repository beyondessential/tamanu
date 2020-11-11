import { NavigationProp } from '@react-navigation/native';
import { WithPatientStoreProps } from '/store/ducks/patient';
import { WithAuthStoreProps } from '../store/ducks/auth';

export interface BaseAppProps
  extends WithPatientStoreProps,
    WithAuthStoreProps {
  navigation: NavigationProp<any>;
  route: any;
}
