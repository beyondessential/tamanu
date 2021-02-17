import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { theme } from '~/ui/styled/theme';
import { Popup } from 'popup-ui';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
interface ErrorComponentProps {
  error: string,
  resetRoute?: string,
}

type ErrorComponentType = React.FC<ErrorComponentProps>; 

interface ErrorBoundaryProps {
  errorKey: string,
  resetRoute?: string,
  errorComponent?: ErrorComponentType,
}

interface ErrorBoundaryState {
  error: Error | null,
}

const FullScreenErrorModal = ({ resetRoute }) => {
  const navigation = useNavigation();

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
    this.setState({ error });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.errorKey !== this.props.errorKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { errorComponent = FullScreenErrorModal } = this.props;
    const { error } = this.state;
    const { resetRoute } = this.props;

    if (error) {
      console.warn(error);
      const ErrorComponent = errorComponent;
      return <ErrorComponent error={error} resetRoute={resetRoute} />;
    }

    return this.props.children || null;
  }
}

export const wrapComponentInErrorBoundary = (Component, resetRoute = Routes.HomeStack.Index) => props => (
  <ErrorBoundary resetRoute={resetRoute} errorKey={props.route.key} >
    <Component {...props} />
  </ErrorBoundary>
);
