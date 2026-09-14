import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { theme } from '~/ui/styled/theme';
import { useTranslation } from '/contexts/TranslationContext';
import { Routes } from '/helpers/routes';

interface ErrorComponentProps {
  error: string;
  resetRoute?: string;
}

type ErrorComponentType = React.FC<ErrorComponentProps> | React.ComponentType<ErrorComponentProps>;

interface ErrorBoundaryProps {
  resetRoute?: string;
  errorComponent?: ErrorComponentType;
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const FullScreenErrorModal = ({ resetRoute = Routes.HomeStack.Index }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const { getTranslation } = useTranslation();

  useEffect(() => {
    Alert.alert(
      getTranslation('general.error.unexpected.title', 'Something went wrong'),
      getTranslation(
        'general.error.unexpected.text',
        'If this continues to happen, please contact your system administrator',
      ),
      [
        {
          text: getTranslation('general.action.ok', 'OK'),
          onPress: () => navigation.replace(resetRoute),
        },
      ],
      { cancelable: false },
    );
  }, [getTranslation, navigation, resetRoute]);

  return <View style={{ backgroundColor: theme.colors.BACKGROUND_GREY }} />;
};

export class ErrorBoundary extends React.PureComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { error: null };

  componentDidCatch(error) {
    console.error(error);
    this.setState({ error });
  }

  render() {
    const { errorComponent = FullScreenErrorModal } = this.props;
    const { error } = this.state;

    if (error) {
      console.warn(error);
      const ErrorComponent = errorComponent;
      return <ErrorComponent error={error} resetRoute={this.props.resetRoute} />;
    }

    return this.props.children || null;
  }
}
