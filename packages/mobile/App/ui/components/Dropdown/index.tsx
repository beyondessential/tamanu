import React, { useState, useCallback, useRef, useEffect, ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { MultiSelect, MultiSelectProps } from './reactNativeMultipleSelect/MultipleSelect';
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
  placeholderText?: string;
  value?: string | string[];
}

const STYLE_PROPS: Record<string, MultiSelectProps> = {
  DEFAULT: {
    styleDropdownMenuSubsection: {
      paddingLeft: 12,
    },
  },
  ERROR: {
    styleInputGroup: {
      borderColor: theme.colors.ERROR,
      borderWidth: 1,
    },
    styleDropdownMenuSubsection: {
      paddingLeft: 12,
      borderRadius: 3,
      borderColor: theme.colors.ERROR,
      borderWidth: 1,
    },
  },
  DISABLED: {
    // styleMainWrapper: {
    //   pointerEvents: 'none',
    // },
    // styleSelectorContainer: {
    //   pointerEvents: 'none',
    // },
    // styleDropdownMenu: {
    //   pointerEvents: 'none',
    // },
    // styleDropdownMenuSubsection: {
    //   pointerEvents: 'none',
    // },
    // styleInputGroup: {
    //   pointerEvents: 'none',
    // },
    // styleItemsContainer: {
    //   pointerEvents: 'none',
    // },
    // styleListContainer: {
    //   pointerEvents: 'none',
    // },
    // styleMainWrapper: {
    //   pointerEvents: 'none',
    // },
    // styleRowList: {
    //   pointerEvents: 'none',
    // },
    // styleSelectorContainer: {
    //   pointerEvents: 'none',
    // },
    // styleTextDropdown: {
    //   pointerEvents: 'none',
    // },
    // styleTextDropdownSelected: {
    //   pointerEvents: 'none',
    // },
    // styleTextTag: {
    //   pointerEvents: 'none',
    // },
    // styleIndicator: {
    //   pointerEvents: 'none',
    //   paddingTop: 200,
    // },
    textColor: theme.colors.DISABLED_GREY,
    styleDropdownMenuSubsection: {
      paddingLeft: 12,
    },
  },
};

// TODO: Types
const getStyleProps = (error, disabled): MultiSelectProps => {
  if (error) return STYLE_PROPS.ERROR;
  if (disabled) return STYLE_PROPS.DISABLED;
  return STYLE_PROPS.DEFAULT;
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
    disabled,
  }: DropdownProps) => {
    const [selectedItems, setSelectedItems] = useState(Array.isArray(value) ? value : [value]);
    const componentRef = useRef(null);
    const onSelectedItemsChange = useCallback(
      items => {
        setSelectedItems(items);
        onChange(items.join(', ')); // Form submits selected items as comma separated string.
      },
      [selectedItems],
    );
    const filterable = options.length >= MIN_COUNT_FILTERABLE_BY_DEFAULT;
    // if (disabled) return null;
    return (
      <StyledView
        width="100%"
        height={screenPercentageToDP(6.68, Orientation.Height)}
        marginBottom={error ? screenPercentageToDP(2, Orientation.Height) : 0}
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
          styleMainWrapper={{ zIndex: 999 }}
          submitButtonColor={theme.colors.SAFE}
          submitButtonText="Confirm selection"
          styleDropdownMenu={{
            height: screenPercentageToDP(6.8, Orientation.Height),
            marginBottom: 0,
          }}
          textInputProps={filterable ? {} : { editable: false, autoFocus: false }}
          searchIcon={filterable ? undefined : null}
          canAddItems={!disabled}
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
      const results = await models.ReferenceData.getSelectOptionsForType(
        referenceDataType,
      );
      setOptions(results);
    })();
  }, []);

  return <Dropdown {...props} options={options}/>;
};
