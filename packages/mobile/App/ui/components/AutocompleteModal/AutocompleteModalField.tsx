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
import { TranslatedTextElement, TranslatedText } from '../Translations/TranslatedText';
import { SearchIcon } from '../Icons';
import { ReadOnlyField } from '../ReadOnlyField/index';
import { useTranslation } from '~/ui/contexts/TranslationContext';

interface AutocompleteModalFieldProps {
  value?: string;
  placeholder?: TranslatedTextElement;
  onChange: (newValue: string, selectedItem: any) => void;
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
  const [label, setLabel] = useState(null);
  const { language } = useTranslation();

  const onPress = (selectedItem): void => {
    onChange(selectedItem.value, selectedItem);
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
      const data = await suggester.fetchCurrentOption(value, language);
      if (data) {
        setLabel(data.label);
      } else {
        setLabel(null);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, language]);

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
