import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { CheckInput } from './CheckField';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const ScrollingContainer = styled.div`
  max-height: 350px;
  overflow-y: auto;
  background-color: white;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border: 1px solid #dedede;
`;

const MultiSelectItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 0;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-top: 5px;
  margin-top: 5px;
  border-top: 1px solid #ccc;
`;

export const ExpandedMultiSelectField = ({
  options,
  field,
  label,
  value: propsValue,
  onChange: propsOnChange,
  selectAllOptionLabel = 'Select all',
  ...props
}) => {
  const { name: fieldName } = field;
  const currentList = useMemo(() => (field ? field.value : propsValue) || [], [field, propsValue]);
  const onChange = field ? field.onChange : propsOnChange;
  const toggle = useCallback(
    e => {
      const { name: optionName, checked } = e.target;
      const newList = checked
        ? [...currentList, optionName]
        : currentList.filter(item => item !== optionName);
      onChange({ target: { name: fieldName, value: newList } });
    },
    [currentList, onChange, fieldName],
  );

  return (
    <OuterLabelFieldWrapper label={label} {...props}>
      <ScrollingContainer data-testid='scrollingcontainer-3esm'>
        <MultiSelectItem key="select_all" data-testid='multiselectitem-2l13'>
          <CheckInput
            label={selectAllOptionLabel}
            value={currentList.length === options.length}
            onChange={e => {
              const { checked } = e.target;
              const newList = checked ? options.map(option => option.value) : [];
              onChange({ target: { name: fieldName, value: newList } });
            }}
            data-testid='checkinput-21pv' />
        </MultiSelectItem>
        <OptionsContainer data-testid='optionscontainer-zwx2'>
          {options.map(option => {
            const { value, label: optionLabel } = option;

            return (
              <MultiSelectItem key={value} data-testid={`multiselectitem-emn6-${value}`}>
                <CheckInput
                  name={value}
                  key={value}
                  label={optionLabel}
                  value={currentList.includes(value)}
                  onChange={toggle}
                  data-testid={`checkinput-67l8-${value}`} />
              </MultiSelectItem>
            );
          })}
        </OptionsContainer>
      </ScrollingContainer>
    </OuterLabelFieldWrapper>
  );
};
