import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Autocomplete from 'react-native-autocomplete-input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ReferenceDataType } from '~/types';
import { useBackend } from '~/ui/helpers/hooks';
import { StyledText, StyledView } from '~/ui/styled/common';

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

export const DiagnosesAutocompleteField = ({
  value,
  onChange,
  placeholder,
}): JSX.Element => {
  const [options, setOptions] = useState([]);
  const [hideResults, setHideResults] = useState(true);
  const { models } = useBackend();

  const [searchTerm, setSearchTerm] = useState(null);
  useEffect(() => {
    (async (): Promise<void> => {
      const data = await models.ReferenceData.searchDataByType(
        ReferenceDataType.ICD10,
        searchTerm,
      );

      setHideResults(false);
      setOptions(data.map(item => item.name.split('\\')[0]));
    })();
  }, [searchTerm]);

  const onSelectItem = useCallback((item) => {
    // want to keep value and search term separate
    // as we don't want user to be able to submit their
    // search string as the actual value..
    onChange(item);
    setHideResults(true);
  }, []);

  return (
    <StyledView>
      <StyledView style={styles.autocompleteContainer}>
        <Autocomplete
          placeholder={placeholder || 'Search...'}
          data={options}
          hideResults={hideResults}
          defaultValue={value}
          onChangeText={setSearchTerm}
          renderItem={({ item }): JSX.Element => (
            <TouchableOpacity style={styles.itemContainer} onPress={(): void => onSelectItem(item)}>
              <StyledText style={styles.item}>
                {item}
              </StyledText>
            </TouchableOpacity>
          )}
        />
      </StyledView>
    </StyledView>
  );
};
