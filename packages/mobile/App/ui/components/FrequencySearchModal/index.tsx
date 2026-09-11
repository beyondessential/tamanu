import React, { type ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import type { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { theme } from '../../styled/theme';
import { TranslatedText } from '../Translations/TranslatedText';
import AutocompleteResult from '../AutocompleteModal/AutocompleteResult';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import type { FrequencySuggester, FrequencySuggestion } from '../../helpers/frequencySuggester';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: theme.colors.BACKGROUND_GREY,
    flex: 1,
    justifyContent: 'space-between',
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

  return (
    <View style={styles.container}>
      <Autocomplete
        placeholder={getTranslation('general.placeholder.search...', 'Search…')}
        placeholderTextColor={theme.colors.TEXT_DARK}
        data={displayedOptions}
        onChangeText={setSearchTerm}
        autoFocus
        flatListProps={{
          keyExtractor: item => item.value,
          renderItem: ({ item, index }) => (
            <AutocompleteResult
              onSelect={onSelectItem}
              option={item}
              useDarkBackground={index % 2 === 0}
            />
          ),
        }}
        style={{
          color: theme.colors.TEXT_DARK,
        }}
      />
      <Button mode="contained" style={styles.backButton} onPress={navigation.goBack}>
        <TranslatedText stringId="general.action.back" fallback="Back" />
      </Button>
    </View>
  );
};
