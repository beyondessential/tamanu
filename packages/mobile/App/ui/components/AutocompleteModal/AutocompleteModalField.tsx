import React, { ReactElement, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledText, StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import { BaseModelSubclass, Suggester } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';
import { SearchIcon } from '../Icons';
import { ReadOnlyField } from '../ReadOnlyField/index';

interface AutocompleteModalFieldProps {
  value?: string;
  placeholder?: string;
  onChange: (newValue: string) => void;
  suggester: Suggester<BaseModelSubclass>;
  modalRoute: string;
  marginTop?: number;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

export const AutocompleteModalField = ({
  label: fieldLabel,
  value,
  placeholder,
  onChange,
  suggester,
  modalRoute = Routes.Autocomplete.Modal,
  error,
  required,
  marginTop = 0,
  disabled = false,
  readOnly = false,
}: AutocompleteModalFieldProps): ReactElement => {
  const navigation = useNavigation();
  const [label, setLabel] = useState(null);
  const onPress = (selectedItem): void => {
    onChange(selectedItem.value);
    setLabel(selectedItem.label);
  };

  const openModal = (): void =>
    navigation.navigate(modalRoute, {
      callback: onPress,
      suggester,
    });

  useEffect(() => {
    if (!suggester) return;
    (async (): Promise<void> => {
      const data = await suggester.fetchCurrentOption(value);
      if (data) {
        setLabel(data.label);
      } else {
        setLabel(null);
      }
    })();
  }, [value]);

  const fontSize = screenPercentageToDP(2.1, Orientation.Height);

  if (readOnly) {
    return <ReadOnlyField value={label} />;
  }

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      {!!fieldLabel && (
        <StyledText
          fontSize={fontSize}
          fontWeight={600}
          marginBottom={2}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {fieldLabel}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      <Button
        marginTop={marginTop}
        backgroundColor={theme.colors.WHITE}
        textColor={
          !!suggester && !!placeholder ? theme.colors.TEXT_SOFT : theme.colors.TEXT_SUPER_DARK
        }
        buttonText={label || placeholder || 'Select'}
        height={screenPercentageToDP(6.68, Orientation.Height)}
        justifyContent="flex-start"
        borderRadius={3}
        borderStyle="solid"
        borderColor={error ? theme.colors.ERROR : '#EBEBEB'}
        borderWidth={1}
        fontWeight={400}
        fontSize={fontSize}
        padding={10}
        onPress={openModal}
        disabled={disabled}
      >
        <StyledView marginRight={5}>
          <SearchIcon fill={theme.colors.TEXT_SOFT} />
        </StyledView>
      </Button>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
