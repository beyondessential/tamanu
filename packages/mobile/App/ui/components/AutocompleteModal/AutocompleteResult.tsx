import React, { type ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '../../styled/theme';

interface SuggestionOption {
  label: string;
  value: string;
}

interface AutocompleteResultProps<T extends SuggestionOption> {
  option: T;
  useDarkBackground: boolean;
  onSelect: (option: T) => void;
}

const styles = StyleSheet.create({
  lightItemText: {
    minHeight: 48,
    padding: 8,
    textAlignVertical: 'center',
  },
  darkItemText: {
    backgroundColor: theme.colors.LIGHT_GREY,
    minHeight: 48,
    padding: 8,
    textAlignVertical: 'center',
  },
});

export default function AutocompleteResult<T extends SuggestionOption>({
  option,
  useDarkBackground,
  onSelect,
}: AutocompleteResultProps<T>): ReactElement {
  return (
    <TouchableOpacity onPress={(): void => onSelect(option)}>
      <Text style={useDarkBackground ? styles.darkItemText : styles.lightItemText}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );
}
