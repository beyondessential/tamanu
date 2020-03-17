import React, { FC } from 'react';
import styled from 'styled-components/native';
import { StyledView, RowView } from '../../styled/common';
import * as Icons from '../Icons';
import { theme } from '../../styled/theme';
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
  disabled?: boolean
}

export const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
}: SearchInputProps) => (
  <RowView
    background={theme.colors.WHITE}
    height={50}
    width="100%"
    alignItems="center"
    paddingLeft={15}
    borderRadius={85}
  >
    <StyledView marginRight={10}>
      <Icons.Search height={20} />
    </StyledView>
    <StyledTextInput
      editable={!disabled}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.TEXT_MID}
      onChangeText={onChange}
    />
  </RowView>
);
