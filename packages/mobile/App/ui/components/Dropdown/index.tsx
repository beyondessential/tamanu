import React, { useState, useCallback, useRef, useEffect, ReactElement } from 'react';

import { StyledView, StyledText } from '/styled/common';
import { MultiSelect } from './MultipleSelect';
import { MultiSelectProps } from './MultipleSelect/types';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { TextFieldErrorMessage } from '../TextField/TextFieldErrorMessage';
import { useBackend } from '~/ui/hooks';

const MIN_COUNT_FILTERABLE_BY_DEFAULT = 8;

export interface SelectOption {
  label: string;
  value: string;
}

export interface DropdownProps extends BaseInputProps {
  options?: SelectOption[];
  onChange?: (items: string) => void;
  multiselect?: boolean;
  label?: string;
  labelColor?: string;
  fixedHeight: boolean;
  searchPlaceholderText?: string;
  selectPlaceholderText?: string;
  value?: string | string[];
  // Note the disabled prop is only known to work with
  // - single
  // - non-filterable
  disabled?: boolean;
}

const baseStyleDropdownMenuSubsection = {
  paddingTop: 9,
  paddingBottom: 9,
  paddingLeft: 12,
  borderRadius: 5,
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
    label = 'Select',
    labelColor,
    fixedHeight = false,
    searchPlaceholderText = 'Search Items...',
    selectPlaceholderText,
    value = [],
    error,
    disabled,
    required = false,
  }: DropdownProps) => {
    const [selectedItems, setSelectedItems] = useState(() => {
      if (!value) {
        return [];
      }

      return Array.isArray(value) ? value : [value];
    });
    const componentRef = useRef(null);
    const onSelectedItemsChange = useCallback(
      items => {
        setSelectedItems(items);
        onChange(items.join(', ')); // Form submits selected items as comma separated string.
      },
      [selectedItems],
    );
    const filterable = options.length >= MIN_COUNT_FILTERABLE_BY_DEFAULT;
    return (
      <StyledView width="100%" marginBottom={screenPercentageToDP(2.24, Orientation.Height)}>
        {!!label && (
          <StyledText
            fontSize={14}
            fontWeight={600}
            marginBottom={2}
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
          selectText={selectPlaceholderText || label}
          searchInputPlaceholderText={filterable ? searchPlaceholderText : label}
          altFontFamily="ProximaNova-Light"
          tagRemoveIconColor={theme.colors.PRIMARY_MAIN}
          tagBorderColor={theme.colors.PRIMARY_MAIN}
          tagTextColor={theme.colors.PRIMARY_MAIN}
          textColor={value?.length ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_SOFT}
          selectedItemTextColor={theme.colors.PRIMARY_MAIN}
          selectedItemIconColor={theme.colors.PRIMARY_MAIN}
          itemTextColor={theme.colors.TEXT_SUPER_DARK}
          itemFontSize={14}
          searchInputStyle={{ color: theme.colors.PRIMARY_MAIN }}
          submitButtonColor={theme.colors.SAFE}
          submitButtonText="Confirm selection"
          styleMainWrapper={{ zIndex: 999 }}
          fixedHeight={fixedHeight}
          styleDropdownMenu={{
            height: screenPercentageToDP(6.8, Orientation.Height),
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
          textInputProps={filterable ? {} : { editable: false, autoFocus: false }}
          searchIcon={filterable ? undefined : null}
          disabled={disabled}
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
  const [options, setOptions] = useState([]);

  useEffect(() => {
    (async (): Promise<void> => {
      const results = await models.ReferenceData.getSelectOptionsForType(referenceDataType);
      setOptions(results);
    })();
  }, []);

  return <Dropdown {...props} options={options} />;
};
