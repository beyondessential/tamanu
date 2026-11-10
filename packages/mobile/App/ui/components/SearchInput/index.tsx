import React, { type FC, useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import * as Icons from '../Icons';
import type { BaseInputProps } from '../../interfaces/BaseInputProps';

const FONT_SIZE = 16;

const StyledTextInput = styled.TextInput`
  font-size: ${FONT_SIZE}px;
  color: ${theme.colors.TEXT_SUPER_DARK};
  height: 100%;
  padding: 0;
`;

const styles = StyleSheet.create({
  truncatedText: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    textAlignVertical: 'center',
  },
});

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
      paddingRight={15}
      borderRadius={85}
    >
      <StyledView marginRight={10}>
        <Icons.SearchIcon
          fill={focus ? theme.colors.PRIMARY_MAIN : theme.colors.TEXT_SOFT}
          height={20}
        />
      </StyledView>
      <StyledView flex={1} height="100%" justifyContent="center">
        <StyledTextInput
          onFocus={onFocus}
          onBlur={onBlur}
          editable={!disabled}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={focus ? theme.colors.TEXT_MID : 'transparent'}
          style={focus ? undefined : { color: 'transparent' }}
          onChangeText={onChange}
        />
        {!focus && (
          <StyledText
            pointerEvents="none"
            numberOfLines={1}
            ellipsizeMode="tail"
            fontSize={FONT_SIZE}
            color={value ? theme.colors.TEXT_SUPER_DARK : theme.colors.TEXT_MID}
            style={styles.truncatedText}
          >
            {value || placeholder}
          </StyledText>
        )}
      </StyledView>
    </RowView>
  );
};
