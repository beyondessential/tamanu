import React, { useState, useCallback, useRef } from 'react';
import { StyledView } from '/styled/common';
import MultiSelect from 'react-native-multiple-select';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
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
  value?: string | string[];
}

const INPUT_GROUP_ERROR_STYLE = { borderColor: theme.colors.ERROR, borderWidth: 1 };
const DROPDOWN_MENU_SUBSECTION_DEFAULT_STYLE = { paddingLeft: 12 };
const DROPDOWN_MENU_SUBSECTION_ERROR_STYLE = {
  paddingLeft: 12,
  borderRadius: 3,
  borderColor: theme.colors.ERROR,
  borderWidth: 1,
};
const getDropdownMenuSubsectionStyle = (error): {} => {
  if (error) return DROPDOWN_MENU_SUBSECTION_ERROR_STYLE;
  return DROPDOWN_MENU_SUBSECTION_DEFAULT_STYLE;
};

export const Dropdown = React.memo(
  ({
    options,
    onChange,
    multiselect = false,
    label = 'Select Items',
    placeholderText = 'Search Items...',
    value = [],
    error,
  }: DropdownProps) => {
    const [selectedItems, setSelectedItems] = useState(Array.isArray(value) ? value : [value]);
    const componentRef = useRef(null);
    const onSelectedItemsChange = useCallback(
      (items) => {
        setSelectedItems(items);
        onChange(items.join(', ')); // Form submits selected items as comma separated string.
      },
      [selectedItems],
    );
    const filterable = options.length >= MIN_COUNT_FILTERABLE_BY_DEFAULT;

    return (
      <StyledView
        width="100%"
        marginTop={10}
      >
        <MultiSelect
          single={!multiselect}
          items={options}
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
          styleInputGroup={error ? INPUT_GROUP_ERROR_STYLE : null}
          styleDropdownMenuSubsection={getDropdownMenuSubsectionStyle(error)}
          styleMainWrapper={{ zIndex: 999 }}
          submitButtonColor={theme.colors.SAFE}
          submitButtonText="Confirm selection"
          textInputProps={filterable ? {} : { editable: false, autoFocus: false }}
          searchIcon={filterable ? undefined : null}
          textColor={error ? theme.colors.ERROR : null}
        />
      </StyledView>
    );
  },
);

export const MultiSelectDropdown = ({ ...props }): Element => <Dropdown multiselect {...props} />;
