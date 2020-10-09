import React, { ReactElement, useCallback, useState, useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { FullView, CenterView, StyledText, StyledView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { VaccineCard, VaccineDataProps } from '/components/VaccineCard';
import { theme } from '/styled/theme';
import { Button } from '../Button';
import { useBackend } from '~/ui/helpers/hooks';

const styles = StyleSheet.create({
  autocompleteContainer: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  item: {
    padding: 12,
  },
  itemContainer: {
    borderBottomWidth: 1,
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
      console.log("data", data)
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

  return (
    <FullView background={theme.colors.MAIN_SUPER_DARK}>
      <StatusBar barStyle="light-content" />
      <CenterView flex={1}>
        <Autocomplete
          placeholder="Search..."
          data={filteredOptions}
          onChangeText={setSearchTerm}
          renderItem={({ item }): JSX.Element => (
            <TouchableOpacity
              style={styles.itemContainer}
              onPress={(): void => onSelectItem(item)}
            >
              <StyledText style={styles.item}>
                {item.label}
              </StyledText>
            </TouchableOpacity>
          )}
        />
        {/* <Button onPress={onNavigateBack} buttonText="go back" /> */}
      </CenterView>
    </FullView>
  );
};
