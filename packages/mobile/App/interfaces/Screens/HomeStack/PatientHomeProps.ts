import { NavigationProp } from '@react-navigation/native';
import { WithPatientStoreProps } from '../../../redux/ducks/patient';

export interface PatientHomeScreenProps extends WithPatientStoreProps {
     navigation: NavigationProp<any>
   }
