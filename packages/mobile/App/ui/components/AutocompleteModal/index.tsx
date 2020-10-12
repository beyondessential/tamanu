import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text } from 'react-native';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FullView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5FCFF',
    flex: 1,
    paddingTop: 25,
  },
  autocompleteContainer: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  lightItemText: {
    backgroundColor: '#ffffff',
    padding: 12,
  },
  darkItemText: {
    backgroundColor: '#f6f8fa',
    padding: 12,
  },
});

type AutocompleteModalParams = {
  AutocompleteModal: {
    // Autocomplete: AutocompleteDataProps;
  };
};

type AutocompleteModalRouteProps = RouteProp<AutocompleteModalParams, 'AutocompleteModal'>;

type AutocompleteModalScreenProps = {
  navigation: NavigationProp<any>;
  route: AutocompleteModalRouteProps;
};

export const AutocompleteModalScreen = ({
  route,
  navigation,
}: AutocompleteModalScreenProps): ReactElement => {
  const { callback, suggester } = route.params;
  const [searchTerm, setSearchTerm] = useState(null);
  const [filteredOptions, filterOptions] = useState([]);

  // const onNavigateBack = useCallback(() => {
  //   callback('data');
  //   navigation.goBack();
  // }, []);

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetchSuggestions(searchTerm);
      console.log('data', data);
      filterOptions(data);
    })();
  }, [searchTerm]);

  const onSelectItem = useCallback((item) => {
    // want to keep value and search term separate
    // as we don't want user to be able to submit their
    // search string as the actual value..
    navigation.goBack();
    callback(item);
  }, []);

  let useDarkBackground = true;
  return (
    <View style={styles.container}>
      <Autocomplete
        containerStyle={styles.autocompleteContainer}
        placeholder="Search..."
        data={filteredOptions}
        onChangeText={setSearchTerm}
        renderItem={({ item }): JSX.Element => {
          useDarkBackground = !useDarkBackground;

          return (
            <TouchableOpacity
              onPress={(): void => onSelectItem(item)}
            >
              <Text style={useDarkBackground ? styles.darkItemText : styles.lightItemText}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};
