import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '~/ui/styled/theme';
import { Popup } from 'popup-ui';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackNavigationProp } from '@react-navigation/stack';

interface ErrorComponentProps {
  error: string,
  resetRoute?: string,
}

type ErrorComponentType = React.FC<ErrorComponentProps> | React.ComponentType<ErrorComponentProps>; 

interface ErrorBoundaryProps {
  resetRoute?: string,
  errorComponent?: ErrorComponentType,
}

interface ErrorBoundaryState {
  error: Error | null,
}

const FullScreenErrorModal = ({ resetRoute = Routes.HomeStack.Index }) => {
  const navigation = useNavigation<StackNavigationProp<any>>();

  Popup.show({
    type: 'Danger',
    title: 'Something went wrong',
    button: true,
    textBody: `Sorry, it looks like an error has occurred. If this continues to happen, please let your IT admin know.`,
    buttonText: 'Ok',
    callback: () => {
      navigation.replace(resetRoute);
      Popup.hide();
    },
  });

  return <View style={{backgroundColor: theme.colors.BACKGROUND_GREY}} />;
}

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
