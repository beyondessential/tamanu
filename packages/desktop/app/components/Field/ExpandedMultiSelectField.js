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
      <ScrollingContainer>
        <MultiSelectItem key="select_all">
          <CheckInput
            label="Select all"
            value={currentList.length === options.length}
            onChange={e => {
              const { checked } = e.target;
              const newList = checked ? options.map(option => option.value) : [];
              onChange({ target: { name: fieldName, value: newList } });
            }}
          />
        </MultiSelectItem>
        <OptionsContainer>
          {options.map(option => {
            const { value, label: optionLabel } = option;

            return (
              <MultiSelectItem key={value}>
                <CheckInput
                  name={value}
                  key={value}
                  label={optionLabel}
                  value={currentList.includes(value)}
                  onChange={toggle}
                />
              </MultiSelectItem>
            );
          })}
        </OptionsContainer>
      </ScrollingContainer>
    </OuterLabelFieldWrapper>
  );
};
