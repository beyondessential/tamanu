import { NavigationProp } from '@react-navigation/native';
import { WithPatientStoreProps } from '/store/ducks/patient';

export interface ViewAllScreenProps extends WithPatientStoreProps {
     navigation: NavigationProp<any>;
   }
