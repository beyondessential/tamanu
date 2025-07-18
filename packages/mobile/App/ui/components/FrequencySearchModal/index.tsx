import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '../../styled/theme';
import { TranslatedText } from '../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { FrequencySuggester, FrequencySuggestion } from '../../helpers/frequencySuggester';

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

type FrequencySearchModalScreenProps = {
  navigation: NavigationProp<any>;
  route: {
    params: {
      suggester: FrequencySuggester;
      callback: (item: FrequencySuggestion) => void;
      modalTitle?: string;
    };
  };
};

export const FrequencySearchModalScreen = ({
  route,
  navigation,
}: FrequencySearchModalScreenProps): ReactElement => {
  const { callback, suggester } = route.params;
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedOptions, setDisplayedOptions] = useState<FrequencySuggestion[]>([]);
  const { getTranslation } = useTranslation();

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetchSuggestions(searchTerm);
      setDisplayedOptions(data);
    })();
  }, [suggester, searchTerm]);

  const onSelectItem = useCallback(
    (item: FrequencySuggestion) => {
      navigation.goBack();
      callback(item);
    },
    [callback, navigation],
  );

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Autocomplete
        placeholder={getTranslation('general.placeholder.search...', 'Search...')}
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
        <TranslatedText stringId="general.action.back" fallback="Back" />
      </Button>
    </View>
  );
};
