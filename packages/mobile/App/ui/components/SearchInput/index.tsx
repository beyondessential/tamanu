import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components/native';
import { RowView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import * as Icons from '../Icons';
import { BaseInputProps } from '../../interfaces/BaseInputProps';

const StyledTextInput = styled.TextInput`
  font-size: 16px;
  color: ${theme.colors.TEXT_SUPER_DARK};
  flex: 1;
  height: 100%;
`;

interface SearchInputProps extends BaseInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  disabled?: boolean;
}

export const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
}: SearchInputProps) => {
  const [focus, setFocus] = useState(false);

  const onFocus = useCallback(() => {
    setFocus(true);
  }, [focus]);

  const onBlur = useCallback(() => {
    setFocus(false);
  }, [focus]);
  return (
    <RowView
      background={theme.colors.WHITE}
      height={50}
      width="100%"
      alignItems="center"
      paddingLeft={15}
      borderRadius={85}
    >
      <StyledView marginRight={10}>
        <Icons.SearchIcon
          fill={focus ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_SOFT}
          height={20}
        />
      </StyledView>
      <StyledTextInput
        onFocus={onFocus}
        onBlur={onBlur}
        editable={!disabled}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.TEXT_MID}
        onChangeText={onChange}
      />
    </RowView>
  );
};
