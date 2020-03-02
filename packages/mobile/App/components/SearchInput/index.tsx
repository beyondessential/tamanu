import React, { FC } from 'react';
import styled from 'styled-components/native';
import { StyledView, RowView } from '../../styled/common';
import * as Icons from '../Icons';
import { theme } from '../../styled/theme';

const StyledTextInput = styled.TextInput`
  font-size: 16px;
  color: ${theme.colors.TEXT_SUPER_DARK};
  flex: 1;
  height: 100%;
`;

interface SearchInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
}

export const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder,
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
      value={value}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.TEXT_MID}
      onChangeText={onChange}
    />
  </RowView>
);
