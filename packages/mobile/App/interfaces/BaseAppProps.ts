import { NavigationProp } from '@react-navigation/native';
import { WithPatientStoreProps } from '../redux/ducks/patient';

export interface BaseAppProps extends WithPatientStoreProps {
    navigation: NavigationProp<any>
}
