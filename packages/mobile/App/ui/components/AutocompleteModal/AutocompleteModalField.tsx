import React, { type ReactElement, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StyledText, StyledView } from '/styled/common';
import { suggestionKeys } from '~/ui/hooks/queries/queryKeys';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import type { BaseModelSubclass, OptionType, Suggester } from '../../helpers/suggester';
import { theme } from '../../styled/theme';
import { Button } from '../Button';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';
import { type TranslatedTextElement, TranslatedText } from '../Translations/TranslatedText';
import { SearchIcon } from '../Icons';
import { ReadOnlyField } from '../ReadOnlyField/index';
import { useTranslation } from '~/ui/contexts/TranslationContext';

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

  // Built in one place so the optimistic update below can't drift from the query key it seeds —
  // if they diverge, selecting an option silently costs a fresh database read instead
  const getCurrentOptionKey = useCallback(
    (optionValue: string | undefined) =>
      suggestionKeys.currentOption(suggester?.model?.name, {
        options: suggester?.options,
        value: optionValue,
        language,
      }),
    [suggester, language],
  );

  const openModal = useCallback(
    (): void =>
      navigation.navigate(modalRoute, {
        callback: (selectedItem: OptionType): void => {
          onChange(selectedItem.value, selectedItem);
          // Optimistic update for immediate UI feedback
          queryClient.setQueryData<OptionType>(
            getCurrentOptionKey(selectedItem.value),
            selectedItem,
          );
        },
        suggester,
      }),
    [getCurrentOptionKey, modalRoute, navigation, onChange, queryClient, suggester],
  );

  // getCurrentOptionKey folds `language` into the key; the lint rule can't see through the helper
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data: currentOption } = useQuery<OptionType | null>({
    queryKey: getCurrentOptionKey(value),
    queryFn: async () => (await suggester.fetchCurrentOption(value, language)) ?? null,
    enabled: Boolean(suggester && value),
  });

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
