import type { NavigationProp } from '@react-navigation/native';
import React, { type ReactElement, useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';
import Autocomplete from 'react-native-autocomplete-input';
import { Button } from 'react-native-paper';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import type { FrequencySuggester, FrequencySuggestion } from '../../helpers/frequencySuggester';
import { theme } from '../../styled/theme';
import AutocompleteResult from '../AutocompleteModal/AutocompleteResult';
import { TranslatedText } from '../Translations/TranslatedText';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.BACKGROUND_GREY,
    flex: 1,
  },
  autocompleteContainer: { flex: 1 },
  resultsContainer: { flex: 1 },
  backButton: { borderRadius: 0 },
});

interface FrequencySearchModalScreenProps {
  navigation: NavigationProp<any>;
  route: {
    params: {
      suggester: FrequencySuggester;
      callback: (item: FrequencySuggestion) => void;
      modalTitle?: string;
    };
  };
}

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

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Autocomplete
        placeholder={getTranslation('general.placeholder.search...', 'Search…')}
        placeholderTextColor={theme.colors.TEXT_DARK}
        data={displayedOptions}
        onChangeText={setSearchTerm}
        autoFocus
        containerStyle={styles.autocompleteContainer}
        listContainerStyle={styles.resultsContainer}
        flatListProps={{
          keyExtractor: item => item.value,
          keyboardShouldPersistTaps: 'handled',
          renderItem: ({ item, index }) => (
            <AutocompleteResult
              onSelect={onSelectItem}
              option={item}
              useDarkBackground={index % 2 === 0}
            />
          ),
        }}
      />
      <Button mode="contained" style={styles.backButton} onPress={navigation.goBack}>
        <TranslatedText stringId="general.action.back" fallback="Back" />
      </Button>
    </KeyboardAvoidingView>
  );
};
