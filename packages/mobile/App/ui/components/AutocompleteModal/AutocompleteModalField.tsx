import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { type ReactElement } from 'react';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { Routes } from '~/ui/helpers/routes';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import type { BaseModelSubclass, OptionType, Suggester } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { SearchIcon } from '../Icons';
import { ReadOnlyField } from '../ReadOnlyField/index';
import { RequiredIndicator } from '../RequiredIndicator';
import { type TranslatedTextElement, TranslatedText } from '../Translations/TranslatedText';
import autocompleteQueryOptions from './currentOptionQuery';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { StyledText, StyledView } from '/styled/common';

interface AutocompleteModalFieldProps {
  value?: string;
  placeholder?: TranslatedTextElement;
  onChange: (newValue: string, selectedItem: OptionType) => void;
  suggester: Suggester<BaseModelSubclass>;
  modalRoute: string;
  marginTop?: number;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  labelColor?: string;
  labelFontSize?: string | number;
  fieldFontSize?: string | number;
  showSearchIcon?: boolean;
}

export const AutocompleteModalField = ({
  label: fieldLabel,
  value,
  placeholder,
  onChange,
  suggester,
  modalRoute = Routes.Forms.AutocompleteModal,
  error,
  required,
  marginTop = 0,
  disabled = false,
  readOnly = false,
  labelFontSize,
  labelColor,
  showSearchIcon = true,
  fieldFontSize = screenPercentageToDP(2.1, Orientation.Height),
}: AutocompleteModalFieldProps): ReactElement => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { language } = useTranslation();

  const openModal = (): void =>
    navigation.navigate(modalRoute, {
      callback: (selectedItem: OptionType): void => {
        onChange(selectedItem.value, selectedItem);
        // Optimistic update for immediate UI feedback
        queryClient.setQueryData(
          autocompleteQueryOptions(suggester, selectedItem.value, language).queryKey,
          selectedItem,
        );
      },
      suggester,
    });

  const { data: currentOption } = useQuery(autocompleteQueryOptions(suggester, value, language));

  const label = currentOption?.label ?? null;

  if (readOnly) {
    return <ReadOnlyField value={label} />;
  }

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      {!!fieldLabel && (
        <StyledText
          fontSize={labelFontSize}
          fontWeight={600}
          marginBottom={2}
          color={labelColor || theme.colors.TEXT_SUPER_DARK}
        >
          {fieldLabel}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      <Button
        marginTop={marginTop}
        backgroundColor={theme.colors.WHITE}
        textColor={label ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
        buttonText={
          label ||
          placeholder || <TranslatedText stringId="general.action.select" fallback="Select" />
        }
        height={screenPercentageToDP(6, Orientation.Height)}
        justifyContent="flex-start"
        borderRadius={3}
        borderStyle="solid"
        borderColor={error ? theme.colors.ERROR : '#EBEBEB'}
        borderWidth={1}
        fontWeight={400}
        fontSize={fieldFontSize}
        padding={screenPercentageToDP(3, Orientation.Width)}
        onPress={openModal}
        disabled={disabled}
      >
        {showSearchIcon && !label && (
          <StyledView marginRight={5}>
            <SearchIcon fill={theme.colors.TEXT_SOFT} />
          </StyledView>
        )}
      </Button>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
