import { NavigationProp } from '@react-navigation/native';
import { RegisterAccountContextProps } from '../../../contexts/RegisterAccountContext';

export interface RegisterAccountScreenProps extends RegisterAccountContextProps {
  navigation: NavigationProp<any>;
}
