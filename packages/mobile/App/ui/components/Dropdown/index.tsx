import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import { StyledText, StyledView } from '/styled/common';
import { MultiSelect } from './MultipleSelect';
import { MultiSelectProps } from './MultipleSelect/types';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { TextFieldErrorMessage } from '../TextField/TextFieldErrorMessage';
import { useBackend } from '~/ui/hooks';
import { TranslatedTextElement } from '../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { getReferenceDataStringId } from '../Translations/TranslatedReferenceData';

const MIN_COUNT_FILTERABLE_BY_DEFAULT = 8;

export interface SelectOption {
  label?: TranslatedTextElement;
  value: string;
}

export interface DropdownProps extends BaseInputProps {
  options?: SelectOption[];
  onChange?: (items: string) => void;
  multiselect?: boolean;
  label?: TranslatedTextElement;
  labelColor?: string;
  labelFontSize?: string | number;
  fieldFontSize?: number;
  fixedHeight?: boolean;
  searchPlaceholderText?: string;
  selectPlaceholderText?: string;
  value?: string | string[];
  // Note the disabled prop is only known to work with
  // - single
  // - non-filterable
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  error?: any;
  allowResetSingleValue?: boolean;
}

const baseStyleDropdownMenuSubsection = {
  paddingTop: 9,
  paddingBottom: 9,
  paddingLeft: screenPercentageToDP(3, Orientation.Width),
  borderRadius: 5,
  height: '100%',
};

const STYLE_PROPS: Record<string, Partial<MultiSelectProps>> = {
  DEFAULT: {
    styleDropdownMenuSubsection: baseStyleDropdownMenuSubsection,
  },
  ERROR: {
    styleInputGroup: {
      borderColor: theme.colors.ALERT,
      borderWidth: 1,
      borderRadius: 6,
    },
    styleDropdownMenuSubsection: {
      ...baseStyleDropdownMenuSubsection,
      borderColor: theme.colors.ALERT,
      borderWidth: 1,
    },
  },
  DISABLED: {
    textColor: theme.colors.DISABLED_GREY,
    styleDropdownMenuSubsection: {
      ...baseStyleDropdownMenuSubsection,
      backgroundColor: theme.colors.BACKGROUND_GREY,
      borderWidth: 0.5,
      borderColor: theme.colors.DISABLED_GREY,
    },
  },
};

const getStyleProps = (error, disabled): Partial<MultiSelectProps> => {
  if (error) return STYLE_PROPS.ERROR;
  if (disabled) return STYLE_PROPS.DISABLED;
  return STYLE_PROPS.DEFAULT;
};

export const Dropdown = React.memo(
  ({
    options,
    onChange,
    multiselect = false,
    label,
    labelColor,
    labelFontSize,
    fieldFontSize = screenPercentageToDP(2.1, Orientation.Height),
    fixedHeight = false,
    searchPlaceholderText,
    selectPlaceholderText,
    value = [],
    error,
    disabled,
    required = false,
    clearable = true,
    allowResetSingleValue,
  }: DropdownProps) => {
    const [selectedItems, setSelectedItems] = useState(() => {
      if (!value) {
        return [];
      }

      return Array.isArray(value) ? value : [value];
    });

    useEffect(() => {
      if (!allowResetSingleValue || Array.isArray(value)) return;
      if (value !== selectedItems[0]) {
        setSelectedItems([value]);
      }
    }, [value, allowResetSingleValue]);

    const componentRef = useRef(null);
    const { getTranslation } = useTranslation();
    const onSelectedItemsChange = useCallback(
      items => {
        setSelectedItems(items);
        onChange(multiselect ? JSON.stringify(items) : items[0]); // Form submits multiselect items as JSON array string OR single item as value string
      },
      [multiselect, onChange],
    );
    const filterable = options.length >= MIN_COUNT_FILTERABLE_BY_DEFAULT;
    const fontSize = fieldFontSize ?? screenPercentageToDP(2.1, Orientation.Height);
    const searchInputPlaceholderText = filterable
      ? searchPlaceholderText || getTranslation('general.placeholder.search...', 'Search...')
      : label?.props?.fallback || label;

    return (
      <StyledView width="100%" marginBottom={screenPercentageToDP(2.24, Orientation.Height)}>
        {!!label && (
          <StyledText
            fontSize={labelFontSize ?? fontSize}
            fontWeight={600}
            marginBottom={screenPercentageToDP(0.5, Orientation.Width)}
            color={labelColor || theme.colors.TEXT_SUPER_DARK}
          >
            {label}
            {required && <StyledText color={theme.colors.ALERT}> *</StyledText>}
          </StyledText>
        )}
        <MultiSelect
          single={!multiselect}
          items={options}
          displayKey="label"
          uniqueKey="value"
          ref={componentRef}
          onSelectedItemsChange={onSelectedItemsChange}
          selectedItems={selectedItems}
          selectText={selectPlaceholderText || label?.props?.fallback || label}
          searchInputPlaceholderText={searchInputPlaceholderText}
          altFontFamily="ProximaNova-Light"
          tagRemoveIconColor={theme.colors.PRIMARY_MAIN}
          tagBorderColor={theme.colors.PRIMARY_MAIN}
          tagTextColor={theme.colors.PRIMARY_MAIN}
          textColor={value?.length ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
          selectedItemTextColor={theme.colors.PRIMARY_MAIN}
          selectedItemIconColor={theme.colors.PRIMARY_MAIN}
          itemTextColor={theme.colors.TEXT_SUPER_DARK}
          itemFontSize={fontSize}
          searchInputStyle={{ color: theme.colors.PRIMARY_MAIN, fontSize, paddingLeft: 0 }}
          submitButtonColor={theme.colors.SAFE}
          submitButtonText={getTranslation('general.action.confirmSelection', 'Confirm selection')}
          styleMainWrapper={{ zIndex: 999 }}
          fixedHeight={fixedHeight}
          styleDropdownMenu={{
            height: screenPercentageToDP(6, Orientation.Height),
            marginBottom: 0,
            borderRadius: 5,
          }}
          styleSelectorContainer={{
            borderRadius: 5,
            backgroundColor: theme.colors.WHITE,
            borderColor: theme.colors.PRIMARY_MAIN,
          }}
          styleRowList={{
            borderRadius: 5,
            backgroundColor: theme.colors.WHITE,
            padding: 5,
          }}
          styleInputGroup={{
            height: screenPercentageToDP(6, Orientation.Height),
            paddingLeft: screenPercentageToDP(3, Orientation.Width),
            borderWidth: 1,
            borderRadius: 6,
            backgroundColor: theme.colors.WHITE,
            borderColor: theme.colors.PRIMARY_MAIN,
          }}
          styleItemsContainer={{
            borderWidth: 1,
            borderRadius: 5,
            borderColor: theme.colors.PRIMARY_MAIN,
          }}
          styleListContainer={{ maxHeight: 300 }}
          textInputProps={filterable ? {} : { editable: false, autoFocus: false }}
          searchIcon={filterable ? undefined : null}
          disabled={disabled}
          clearable={clearable}
          fontSize={fieldFontSize}
          {...getStyleProps(error, disabled)}
        />
        {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
      </StyledView>
    );
  },
);

export const MultiSelectDropdown = ({ ...props }): ReactElement => (
  <Dropdown multiselect {...props} />
);

export const SuggesterDropdown = ({ referenceDataType, ...props }): ReactElement => {
  const { models } = useBackend();
  const { getTranslation } = useTranslation();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const results = await models.ReferenceData.getSelectOptionsForType(referenceDataType);
      const translatedResults = results.map(option => {
        const stringId = getReferenceDataStringId(option.value, referenceDataType);
        return {
          label: getTranslation(stringId, option.label),
          value: option.value,
        };
      });
      setOptions(translatedResults);
    })();
    // Only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Dropdown {...props} options={options} />;
};
