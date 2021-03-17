import { NavigationProp } from '@react-navigation/native';
import { WithPatientStoreProps } from '/store/ducks/patient';

export interface PatientHomeScreenProps extends WithPatientStoreProps {
     navigation: NavigationProp<any>;
   }
