import React, { useEffect, useState, ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView, StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { Suggester, BaseModelSubclass, OptionType } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';
import { useTranslation } from '~/ui/contexts/TranslationContext';

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

const extractLabel = (items: OptionType[]) => {
  return items.map((x) => x.label).join(', ');
};

export const MultiSelectModalField = ({
  label: fieldLabel,
  value,
  modalTitle = 'Title',
  placeholder = 'Select',
  onChange,
  suggester,
  modalRoute = Routes.Forms.MultiSelectModal,
  error,
  required,
  marginTop = 0,
  disabled = false,
  searchPlaceholder,
}: MultiSelectModalFieldProps): ReactElement => {
  const navigation = useNavigation();
  const [label, setLabel] = useState(null);
  const { language } = useTranslation();

  const handleSaveCallback = (selectedItems: OptionType[]): void => {
    onChange(selectedItems);
    setLabel(extractLabel(selectedItems));
  };

  const openModal = (): void =>
    navigation.navigate(modalRoute, {
      callback: handleSaveCallback,
      suggester,
      modalTitle,
      value,
      searchPlaceholder,
    });

  // This function is not in use, however, it's meant to be used when
  // initial values are set. Pay extra care to the value format it expects.
  const loadInitialLabel = useCallback(
    async (values: string[]) => {
      if (values.length === 0) {
        return;
      }
      const selectedValues: OptionType[] = [];
      for (const x of values) {
        const data = await suggester.fetchCurrentOption(x, language);
        selectedValues.push(data);
      }

      const updatedLabel = extractLabel(selectedValues);
      setLabel(updatedLabel);
    },
    [suggester, language],
  );

  useEffect(() => {
    if (!value) return;
    loadInitialLabel(value);
    // Disabling the linter because we only want to run this on mount
    // if the component has an initial value and ignore value updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        buttonText={label || placeholder}
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
