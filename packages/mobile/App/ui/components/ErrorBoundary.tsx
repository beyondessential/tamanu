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

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.BACKGROUND_GREY,
  },
});

const ErrorModal = ({ error, resetRoute }) => {
  const navigation = useNavigation();
  console.log('Error! Oh no!');

  Popup.show({
    type: 'Danger',
    title: 'Something went wrong',
    button: true,
    textBody: `Sorry, it looks like an error has occurred. If this continues to happen, please let your IT admin know.`,
    buttonText: 'Ok',
    callback: () => {
      Popup.hide();
      console.error(error);
      navigation.navigate(resetRoute);
    },
  });

  return (
    <View style={styles.container} />
  );
}
interface ErrorComponentProps {
  error: String,
  resetRoute?: String,
}

type ErrorComponentType = React.FC<ErrorComponentProps>; 

interface ErrorBoundaryProps {
  errorKey?: String,
  resetRoute?: String,
  ErrorComponent?: ErrorComponentType,
}

interface ErrorBoundaryState {
  error?: String,
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
    const { ErrorComponent = ErrorModal } = this.props;
    const { error } = this.state;
    const { resetRoute } = this.props;

    // console.log(this.props, this.state);
    if (error) {
      console.error(error);
      return <ErrorComponent error={error} resetRoute={resetRoute} />;
    }

    return this.props.children || null;
  }
}

export const wrapComponentInErrorBoundary = (Component, resetRoute = Routes.HomeStack.Index) => {
  const WrappedComponent = props => {
    // const navigation = useNavigation();
    // const { dangerouslyGetState } = useNavigation();
    // const { index, routes } = dangerouslyGetState()
    // const errorKey = routes[index].name;

    return (
      <ErrorBoundary resetRoute={resetRoute} errorKey={'1'} >
        <Component {...props} />
      </ErrorBoundary>
    )
  };
  return WrappedComponent;
}

// const hi = ["navigation", 
// {"addListener": [Function addListener],
//  "canGoBack": [Function canGoBack],
//   "dangerouslyGetParent": [Function dangerouslyGetParent],
//    "dangerouslyGetState": [Function anonymous],
//     "dispatch": [Function dispatch],
//      "goBack": [Function anonymous],
//       "isFocused": [Function isFocused],
//        "navigate": [Function anonymous],
//        "pop": [Function anonymous], 
//        "popToTop": [Function anonymous], 
//        "push": [Function anonymous], 
//        "removeListener": [Function removeListener],
//        "replace": [Function anonymous],
//        "reset": [Function anonymous],
//        "setOptions": [Function setOptions],
//        "setParams": [Function anonymous]}]
// const hi1_1 [["navigation", 
// {"addListener": [Function addListener], 
// "canGoBack": [Function canGoBack], 
// "dangerouslyGetParent": [Function dangerouslyGetParent], "dangerouslyGetState": [Function anonymous], "dispatch": [Function dispatch], "goBack": [Function anonymous], 
// "isFocused": [Function isFocused], "navigate": [Function anonymous], "pop": [Function anonymous], "popToTop": [Function anonymous], "push": [Function anonymous], 
// "removeListener": [Function removeListener], "replace": [Function anonymous], "reset": [Function anonymous], "setOptions": [Function setOptions], 
// "setParams": [Function anonymous]}], 
// ["route", {"key": "/HomeStack/HomeTabs/Index-5sDmKG3yDKHm-TnlPz0Q2", "name": "/HomeStack/HomeTabs/Index", "params": undefined}]]
// ["route", {"key": "/HomeStack/HomeTabs/Index-5sDmKG3yDKHm-TnlPz0Q2", "name": "/HomeStack/HomeTabs/Index", "params": undefined}]
// const hi3 =  [["navigation", {"addListener": [Function addListener], "canGoBack": [Function canGoBack], "dangerouslyGetParent": [Function dangerouslyGetParent], "dangerouslyGetState": [Function anonymous], "dispatch": [Function dispatch], "goBack": [Function anonymous], "isFocused": [Function isFocused], "navigate": [Function anonymous], "pop": [Function anonymous], "popToTop": [Function anonymous], "push": [Function anonymous], "removeListener": [Function removeListener], "replace": [Function anonymous], "reset": [Function anonymous], "setOptions": [Function setOptions], "setParams": [Function anonymous]}], ["route", {"key": "/HomeStack/HomeTabs/Index-5sDmKG3yDKHm-TnlPz0Q2", "name": "/HomeStack/HomeTabs/Index", "params": undefined}]]