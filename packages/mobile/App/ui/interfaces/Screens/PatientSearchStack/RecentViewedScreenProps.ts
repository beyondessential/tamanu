import { WithPatientStoreProps } from '/store/ducks/patient';
import { NavigationProp } from '@react-navigation/native';

export interface RecentViewedScreenProps extends WithPatientStoreProps {
  navigation: NavigationProp<any>;
}
