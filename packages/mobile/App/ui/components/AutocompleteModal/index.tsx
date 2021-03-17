import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Button } from "react-native-paper";
import { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '~/ui/styled/theme';
import { Suggester } from '~/ui/helpers/suggester';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: theme.colors.BACKGROUND_GREY,
    flex: 1,
    justifyContent: 'space-between',
  },
  lightItemText: {
    backgroundColor: theme.colors.WHITE,
    padding: 12,
  },
  darkItemText: {
    backgroundColor: theme.colors.LIGHT_GREY,
    padding: 12,
  },
  backButton: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 0
  }
});

type AutocompleteModalScreenProps = {
  navigation: NavigationProp<any>;
  route: {
    params: {
      suggester: Suggester,
      callback: (item: any) => any,
  }};
};

export const AutocompleteModalScreen = ({
  route,
  navigation,
}: AutocompleteModalScreenProps): ReactElement => {
  const { callback, suggester } = route.params;
  const [searchTerm, setSearchTerm] = useState(null);
  const [displayedOptions, setDisplayedOptions] = useState([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetchSuggestions(searchTerm);
      setDisplayedOptions(data);
    })();
  }, [searchTerm]);

  const onSelectItem = useCallback((item) => {
    navigation.goBack();
    callback(item);
  }, []);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  let useDarkBackground = true;
  return (
    <View style={styles.container}>
      <Autocomplete
        placeholder="Search..."
        data={displayedOptions}
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
      <Button
        mode="contained"
        style={styles.backButton}
        onPress={onNavigateBack}
      >Back</Button>
    </View>
  );
};
