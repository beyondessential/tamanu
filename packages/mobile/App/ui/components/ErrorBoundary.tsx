import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '~/ui/styled/theme';
import { Popup } from 'popup-ui';
import { useNavigation } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { Button } from './Button';


interface ErrorComponentProps {
  error: string,
  resetRoute?: string,
}

type ErrorComponentType = React.FC<ErrorComponentProps>; 

interface ErrorBoundaryProps {
  errorKey?: string,
  resetRoute?: string,
  ErrorComponent?: ErrorComponentType,
}

interface ErrorBoundaryState {
  error?: string,
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.BACKGROUND_GREY,
  },
});

const FullScreenErrorModal = ({ error, resetRoute=Routes.HomeStack.PatientDetails }) => {
  const navigation = useNavigation();
  console.log('Error! Oh no!', resetRoute);

  Popup.show({
    type: 'Danger',
    title: 'Something went wrong',
    button: true,
    textBody: `Sorry, it looks like an error has occurred. If this continues to happen, please let your IT admin know.`,
    buttonText: 'Ok',
    callback: () => {
      console.log('Navigating: ', resetRoute);
      // navigation.navigate(resetRoute); // This does not appear to navigate anywhere (disp)
      navigation.goBack(); // This works as I expect it to
      Popup.hide();
    },
  });

  return (
    <View style={styles.container}>
      <Text>
        This text should disappear after the user clicks "ok" on the popup
      </Text>
    </View>
  );
}

export class ErrorBoundary extends React.PureComponent<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { error: null };

  componentDidCatch(error) {
    this.setState({ error });
  }

  componentDidUpdate(prevProps) {
    console.log("ErrorBoundary rerendered with: ", this.props);
    if (prevProps.errorKey !== this.props.errorKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { ErrorComponent = FullScreenErrorModal } = this.props;
    const { error } = this.state;
    const { resetRoute } = this.props;

    if (error) {
      console.error(error);
      return <ErrorComponent error={error} resetRoute={resetRoute} />;
    }

    return this.props.children || null;
  }
}

export const wrapComponentInErrorBoundary = (Component, resetRoute = Routes.HomeStack.Index) => {
  const WrappedComponent = props => {
    console.log("Rendering wrapped component: ", props.route.key);

    return (
      <ErrorBoundary resetRoute={resetRoute} errorKey={props.route.key} >
        <Component {...props} />
      </ErrorBoundary>
    )
  };
  return WrappedComponent;
}
