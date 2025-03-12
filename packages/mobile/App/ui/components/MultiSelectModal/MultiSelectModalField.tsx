import React, { useEffect, useState, ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView, StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Suggester, BaseModelSubclass, OptionType } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';

interface MultiSelectModalFieldProps {
  value?: string[];
  modalTitle: string;
  placeholder?: string;
  onChange: (newValue: OptionType[]) => void;
  suggester: Suggester<BaseModelSubclass>;
  modalRoute: string;
  marginTop?: number;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
}

const appendLabel = (items: OptionType[]) => {
  return items.map(x => ` ${x.label}`).toString();
};

export const MultiSelectModalField = ({
  label: fieldLabel,
  value,
  modalTitle = 'Title',
  placeholder,
  onChange,
  suggester,
  modalRoute = Routes.Autocomplete.MultiSelectModal,
  error,
  required,
  marginTop = 0,
  disabled = false,
  searchPlaceholder,
}: MultiSelectModalFieldProps): ReactElement => {
  const navigation = useNavigation();
  const [label, setLabel] = useState(null);

  const handleSaveCallback = (selectedItems: OptionType[]): void => {
    onChange(selectedItems);
    setLabel(appendLabel(selectedItems));
  };

  const openModal = (): void =>
    navigation.navigate(modalRoute, {
      callback: handleSaveCallback,
      suggester,
      modalTitle,
      value,
      searchPlaceholder,
    });
  const loadInitialLabel = async (values: string[]) => {
    const selectedValues: OptionType[] = [];
    values.forEach(async x => {
      const data = await suggester.fetchCurrentOption(x);
      selectedValues.push(data);
    });
    const updatedLabel = appendLabel(selectedValues);
    setLabel(selectedValues.length > 0 ? updatedLabel : setLabel(placeholder));
  };

  useEffect(() => {
    if (!suggester || !value) return;
    loadInitialLabel(value);
  }, []);

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
        buttonText={label || 'Select'}
        minHeight={screenPercentageToDP(6.68, Orientation.Height)}
        height={'auto'}
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
