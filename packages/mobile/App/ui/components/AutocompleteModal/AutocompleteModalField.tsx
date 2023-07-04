import React, { useEffect, useState, ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView, StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Suggester, BaseModelSubclass } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';

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
}

export const AutocompleteModalField = ({
  label: fieldLabel,
  value,
  placeholder,
  onChange,
  suggester,
  modalRoute,
  error,
  required,
  marginTop = 0,
  disabled = false,
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
        setLabel(placeholder);
      }
    })();
  }, [value]);

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      {!!fieldLabel && (
        <StyledText
          fontSize={14}
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
        textColor={label ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
        buttonText={label || placeholder || 'Select'}
        height={screenPercentageToDP(6.68, Orientation.Height)}
        justifyContent="flex-start"
        borderRadius={3}
        borderStyle="solid"
        borderColor={error ? theme.colors.ERROR : '#EBEBEB'}
        borderWidth={1}
        fontWeight={400}
        fontSize={15}
        padding={10}
        onPress={openModal}
        disabled={disabled}
      />
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
