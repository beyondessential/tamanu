import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '../../styled/theme';
import { BaseModelSubclass, Suggester } from '../../helpers/suggester';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: theme.colors.BACKGROUND_GREY,
    flex: 1,
    justifyContent: 'space-between',
  },
  lightItemText: {
    color: theme.colors.TEXT_DARK,
    backgroundColor: theme.colors.WHITE,
    padding: 12,
  },
  darkItemText: {
    color: theme.colors.TEXT_DARK,
    backgroundColor: theme.colors.LIGHT_GREY,
    padding: 12,
  },
  backButton: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: 0,
  },
});

type AutocompleteModalScreenProps = {
  navigation: NavigationProp<any>;
  route: {
    params: {
      suggester: Suggester<BaseModelSubclass>;
      callback: (item: any) => any;
    };
  };
};

export const AutocompleteModalScreen = ({
  route,
  navigation,
}: AutocompleteModalScreenProps): ReactElement => {
  const { callback, suggester } = route.params;
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedOptions, setDisplayedOptions] = useState([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetchSuggestions(searchTerm);
      setDisplayedOptions(data);
    })();
  }, [searchTerm]);

  const onSelectItem = useCallback(item => {
    navigation.goBack();
    callback(item);
  }, []);

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <View style={styles.container}>
      <Autocomplete
        placeholder="Search..."
        placeholderTextColor={theme.colors.TEXT_DARK}
        data={displayedOptions}
        onChangeText={setSearchTerm}
        autoFocus
        flatListProps={{
          keyExtractor: item => item.value,
          renderItem: ({ item, index }): ReactElement => {
            const useDarkBackground = index % 2 === 0;
            return (
              <TouchableOpacity onPress={(): void => onSelectItem(item)}>
                <Text style={useDarkBackground ? styles.darkItemText : styles.lightItemText}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          },
        }}
        style={{
          color: theme.colors.TEXT_DARK,
        }}
      />
      <Button mode="contained" style={styles.backButton} onPress={onNavigateBack}>
        Back
      </Button>
    </View>
  );
};
