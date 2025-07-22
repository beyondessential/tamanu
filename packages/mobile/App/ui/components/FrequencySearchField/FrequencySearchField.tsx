import React, { useMemo, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledText, StyledView } from '~/ui/styled/common';
import { theme } from '../../styled/theme';
import { FrequencySuggester, FrequencySuggestion } from '../../helpers/frequencySuggester';
import {
  getTranslatedFrequencySynonyms,
  getFrequencySuggestions,
} from '../../helpers/medicationHelpers';
import { useTranslation } from '../../contexts/TranslationContext';
import { TranslatedText } from '../Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import { RequiredIndicator } from '../RequiredIndicator';
import { Button } from '../Button';
import { Routes } from '~/ui/helpers/routes';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { SearchIcon } from '../Icons';
import { ReadOnlyField } from '../ReadOnlyField/index';
import { useSettings } from '~/ui/contexts/SettingsContext';

interface FrequencySearchFieldProps {
  value?: string;
  onChange: (value: string) => void;
  label?: React.ReactNode;
  required?: boolean;
  labelColor?: string;
  labelFontSize?: number;
  fieldFontSize?: number;
  showSearchIcon?: boolean;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  marginTop?: number;
}

const FrequencySearchInput: React.FC<FrequencySearchFieldProps> = ({
  value,
  onChange,
  label,
  required,
  labelColor = theme.colors.TEXT_DARK,
  labelFontSize = 14,
  fieldFontSize = 14,
  showSearchIcon = false,
  error,
  disabled = false,
  readOnly = false,
  marginTop = 0,
}) => {
  const { getSetting } = useSettings();
  const navigation = useNavigation();
  const { getTranslation } = useTranslation();
  const [displayLabel, setDisplayLabel] = useState<string | null>(null);
  const frequenciesEnabled: any = getSetting(`medications.frequenciesEnabled`);

  const frequencySuggester = useMemo(() => {
    const synonyms = getTranslatedFrequencySynonyms(frequenciesEnabled, getTranslation);
    const suggestions = getFrequencySuggestions(synonyms);
    return new FrequencySuggester(suggestions);
  }, [frequenciesEnabled, getTranslation]);

  const onPress = (selectedItem: FrequencySuggestion): void => {
    onChange(selectedItem.value);
    setDisplayLabel(selectedItem.label);
  };

  const openModal = (): void =>
    navigation.navigate(Routes.Forms.FrequencySearchModal, {
      callback: onPress,
      suggester: frequencySuggester,
      modalTitle: getTranslation('medication.frequency.searchTitle', 'Select Frequency'),
    });

  useEffect(() => {
    if (!frequencySuggester) return;
    (async (): Promise<void> => {
      const data = await frequencySuggester.fetchCurrentOption(value);
      if (data) {
        setDisplayLabel(data.label);
      } else {
        setDisplayLabel(null);
      }
    })();
  }, [value, frequencySuggester]);

  if (readOnly) {
    return <ReadOnlyField value={displayLabel} />;
  }

  const defaultLabel = (
    <TranslatedText stringId="medication.frequency.label" fallback="Frequency" />
  );

  const defaultPlaceholder = <TranslatedText stringId="general.action.select" fallback="Select" />;

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      {!!label && (
        <StyledText
          fontSize={labelFontSize}
          fontWeight={600}
          marginBottom={2}
          color={labelColor || theme.colors.TEXT_SUPER_DARK}
        >
          {label || defaultLabel}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      <Button
        marginTop={marginTop}
        backgroundColor={theme.colors.WHITE}
        textColor={displayLabel ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
        buttonText={displayLabel || defaultPlaceholder}
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
        {showSearchIcon && !displayLabel && (
          <StyledView marginRight={5}>
            <SearchIcon fill={theme.colors.TEXT_SOFT} />
          </StyledView>
        )}
      </Button>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};

interface FormikFrequencySearchFieldProps {
  value: string;
  onChange: (newValue: any) => void;
  label?: React.ReactNode;
  error?: string;
  required?: boolean;
  labelColor?: string;
  labelFontSize?: number;
  fieldFontSize?: number;
  showSearchIcon?: boolean;
}

export const FrequencySearchField: React.FC<FormikFrequencySearchFieldProps> = ({
  value,
  onChange,
  label,
  error,
  required,
  labelColor,
  labelFontSize,
  fieldFontSize,
  showSearchIcon,
}) => {
  return (
    <FrequencySearchInput
      value={value}
      onChange={newValue => onChange(newValue)}
      label={label}
      error={error}
      required={required}
      labelColor={labelColor}
      labelFontSize={labelFontSize}
      fieldFontSize={fieldFontSize}
      showSearchIcon={showSearchIcon}
    />
  );
};
