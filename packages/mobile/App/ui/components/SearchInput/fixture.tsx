import React, { useState, useCallback, useEffect, ReactElement } from 'react';
import { debounce } from '/helpers/input';
import { StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { SearchInput } from './index';

export function BaseStory(): ReactElement {
  const [showMessage, setShowMessage] = useState(false);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowMessage(false);
    }, 3000);
    return (): void => clearTimeout(timeoutId);
  }, [showMessage]);
  const [text, setText] = useState('');

  const showDeboucedMessage = debounce(() => setShowMessage(true), 800);

  const onChangeText = useCallback(
    (newText: string) => {
      setText(newText);
      showDeboucedMessage();
    },
    [showDeboucedMessage],
  );

  return (
    <>
      {showMessage && (
        <StyledText fontSize={30} color={theme.colors.WHITE}>
          Something called after debouce.
        </StyledText>
      )}
      <SearchInput
        placeholder="Search for patients"
        value={text}
        onChange={onChangeText}
      />
    </>
  );
}
