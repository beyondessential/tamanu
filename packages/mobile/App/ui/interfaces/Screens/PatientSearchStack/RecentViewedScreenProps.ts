import type { NavigationProp } from '@react-navigation/native';
import type { WithPatientStoreProps } from '/store/ducks/patient';

export interface RecentViewedScreenProps extends WithPatientStoreProps {
  navigation: NavigationProp<any>;
}
