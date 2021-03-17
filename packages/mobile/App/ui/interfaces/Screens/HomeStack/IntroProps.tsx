import { NavigationProp } from '@react-navigation/native';

export interface IntroRouteProps {
  user: { name: string };
  message: string;
  title: string;
  nextRoute: string | '';
  step: number;
}

export interface IntroScreenProps {
  navigation: NavigationProp<any>;
  route: {
    params: IntroRouteProps;
  };
}
