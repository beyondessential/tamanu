import React, { type ReactElement, useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import type { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useQuery, type PlaceholderDataFunction } from '@tanstack/react-query';
import { StyledView } from '~/ui/styled/common';
import { theme } from '../../styled/theme';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import type { BaseModelSubclass, Suggester, OptionType } from '../../helpers/suggester';
import { suggestionKeys } from '~/ui/hooks/queries/queryKeys';
import { TranslatedText } from '../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

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
      modalTitle?: string;
    };
  };
};

const holdPreviousData: PlaceholderDataFunction<OptionType[]> = previousData => previousData ?? [];

export const AutocompleteModalScreen = ({
  route,
  navigation,
}: AutocompleteModalScreenProps): ReactElement => {
  const { callback, suggester, modalTitle } = route.params;
  const [searchTerm, setSearchTerm] = useState('');
  const { language, getTranslation } = useTranslation();

  const { data: displayedOptions } = useQuery<OptionType[]>({
    // The Suggester instance itself must stay out of the key: it holds non-serializable
    // members (model class, filter/formatter functions), so it would hash incompletely.
    // Its query-relevant state is captured by model name + options + filterCacheKey.
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: suggestionKeys.list(suggester.model.name, {
      options: suggester.options,
      search: searchTerm,
      language,
      filterCacheKey: suggester.filterCacheKey,
    }),
    queryFn: () => suggester.fetchSuggestions(searchTerm, language),
    // Keep previous list on screen while during reloads to prevent flicker
    placeholderData: holdPreviousData,
  });

  const onSelectItem = useCallback(
    item => {
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
      {modalTitle && (
        <EmptyStackHeader
          title={modalTitle}
          onGoBack={() => {
            navigation.goBack();
          }}
        />
      )}
      {modalTitle && (
        <StyledView borderColor={theme.colors.BOX_OUTLINE} borderBottomWidth={1}></StyledView>
      )}
      <Autocomplete
        placeholder={getTranslation('general.placeholder.search...', 'Search…')}
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
