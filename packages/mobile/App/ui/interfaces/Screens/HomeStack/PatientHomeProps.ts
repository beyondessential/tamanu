import { WithPatientStoreProps } from '/store/ducks/patient';
import { NavigationProp } from '@react-navigation/native';

export interface PatientHomeScreenProps extends WithPatientStoreProps {
  navigation: NavigationProp<any>;
}
