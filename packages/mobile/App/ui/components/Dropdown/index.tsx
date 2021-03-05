import React, { useState, useCallback, useRef } from 'react';
import { StyledView } from '/styled/common';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import MultiSelect from 'react-native-multiple-select';
import { theme } from '~/ui/styled/theme';

export interface SelectOption {
  label: string;
  value: string;
}

export interface DropdownProps extends BaseInputProps {
  options?: SelectOption[];
  onChange?: Function;
  isSingleSelect?: boolean;
}

export const Dropdown = React.memo(
  ({
    options,
    onChange,
    isSingleSelect = true,
  }: DropdownProps) => {
    const [selectedItems, setSelectedItems] = useState([]);
    const componentEl = useRef(null);
    const onSelectedItemsChange = useCallback(
      (items) => {
        setSelectedItems(items);
        onChange(items.join(', ')) // Form submits selected items as comma separated string.
      },
      [selectedItems]
    );

    return (
      <StyledView
        width="100%"
        marginTop={10}
      >
        <MultiSelect
          single={isSingleSelect}
          items={options}
          displayKey="label"
          uniqueKey="value"
          ref={componentEl}
          onSelectedItemsChange={onSelectedItemsChange}
          selectedItems={selectedItems}
          selectText="Select Items"
          searchInputPlaceholderText="Search Items..."
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
        />
      </StyledView>
    )
  }
);
