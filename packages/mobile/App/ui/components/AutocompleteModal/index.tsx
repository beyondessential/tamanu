import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { StyledView } from '~/ui/styled/common';
import { theme } from '../../styled/theme';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { BaseModelSubclass, Suggester } from '../../helpers/suggester';
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

export const AutocompleteModalScreen = ({
  route,
  navigation,
}: AutocompleteModalScreenProps): ReactElement => {
  const { callback, suggester, modalTitle } = route.params;
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedOptions, setDisplayedOptions] = useState([]);
  const { language, getTranslation } = useTranslation();

  useEffect(() => {
    (async (): Promise<void> => {
      const data = await suggester.fetchSuggestions(searchTerm, language);
      setDisplayedOptions(data);
    })();
  }, [suggester, searchTerm, language]);

  const onSelectItem = useCallback((item) => {
    navigation.goBack();
    callback(item);
  }, [callback, navigation]);

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
        placeholder={getTranslation('general.placeholder.search...', 'Search...')}
        placeholderTextColor={theme.colors.TEXT_DARK}
        data={displayedOptions}
        onChangeText={setSearchTerm}
        autoFocus
        flatListProps={{
          keyExtractor: (item) => item.value,
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
