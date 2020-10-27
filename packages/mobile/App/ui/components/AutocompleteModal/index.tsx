import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '~/ui/styled/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.BACKGROUND_GREY,
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
    backgroundColor: theme.colors.WHITE,
    padding: 12,
  },
  darkItemText: {
    backgroundColor: theme.colors.LIGHT_GREY,
    padding: 12,
  },
});

type AutocompleteModalScreenProps = {
  navigation: NavigationProp<any>;
  route: any;
};

export const AutocompleteModalScreen = ({
  route,
  navigation,
}: AutocompleteModalScreenProps): ReactElement => {
  const { callback, suggester } = route.params;
  const [searchTerm, setSearchTerm] = useState(null);
  const [filteredOptions, filterOptions] = useState([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetchSuggestions(searchTerm);
      filterOptions(data);
    })();
  }, [searchTerm]);

  const onSelectItem = useCallback((item) => {
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
        autoFocus={true}
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
