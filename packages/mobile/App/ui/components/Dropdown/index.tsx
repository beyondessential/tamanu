import React, { useState, useCallback, useRef } from 'react';
import { StyledView } from '/styled/common';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import MultiSelect from 'react-native-multiple-select';
import { theme } from '~/ui/styled/theme';

const MIN_COUNT_FILTERABLE_BY_DEFAULT = 8;

export interface SelectOption {
  label: string;
  value: string;
}

export interface DropdownProps extends BaseInputProps {
  options?: SelectOption[];
  onChange?: Function;
  multiselect?: boolean;
  label?: string;
  placeholderText?: string;
  nullableOption?: boolean;
}

export const Dropdown = React.memo(
  ({
    options,
    onChange,
    nullableOption = false,
    multiselect = false,
    label = 'Select Items',
    placeholderText = 'Search Items...',
  }: DropdownProps) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const componentRef = useRef(null);
    const onSelectedItemsChange = useCallback(
      (items) => {
        setSelectedItems(items.filter(i => i !== null));
        onChange(items.join(', ')) // Form submits selected items as comma separated string.
      },
      [selectedItems]
    );
    const filterable = options.length >= MIN_COUNT_FILTERABLE_BY_DEFAULT;

    const displayedOptions = nullableOption ? [
      {
        value: null,
        label: '[ Clear ]',
      },
      ...options,
    ] : options;

    return (
      <StyledView
        width="100%"
        marginTop={10}
      >
        <MultiSelect
          single={!multiselect}
          items={displayedOptions}
          displayKey="label"
          uniqueKey="value"
          ref={componentRef}
          onSelectedItemsChange={onSelectedItemsChange}
          selectedItems={selectedItems}
          selectText={label}
          searchInputPlaceholderText={filterable ? placeholderText : label}
          altFontFamily="ProximaNova-Light"
          tagRemoveIconColor={theme.colors.PRIMARY_MAIN}
          tagBorderColor={theme.colors.PRIMARY_MAIN}
          tagTextColor={theme.colors.PRIMARY_MAIN}
          selectedItemTextColor={theme.colors.PRIMARY_MAIN}
          selectedItemIconColor={theme.colors.PRIMARY_MAIN}
          itemTextColor="#000"
          searchInputStyle={{ color: theme.colors.PRIMARY_MAIN }}
          styleDropdownMenuSubsection={{ paddingLeft: 12 }}
          styleMainWrapper={{ zIndex: 999 }}
          submitButtonColor={theme.colors.SAFE}
          submitButtonText="Confirm selection"
          textInputProps={filterable ? {} : { editable: false, autoFocus: false }}
          searchIcon={filterable ? undefined : null}
        />
      </StyledView>
    )
  }
);

export const MultiSelectDropdown = ({ ...props }): Element => <Dropdown multiselect={true} {...props} />;
