import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from '../../helpers/input';
import { SearchInput } from './index';
import { StyledText } from '../../styled/common';
import { theme } from '../../styled/theme';

export function BaseStory() {
  const [showMessage, setShowMessage] = useState(false);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowMessage(false);
    }, 3000);
    return () => clearTimeout(timeoutId);
  }, [showMessage]);
  const [text, setText] = useState('');

  const showDeboucedMessage = debounce(() => setShowMessage(true), 800);

  const onChangeText = useCallback(
    (text: string) => {
      setText(text);
      showDeboucedMessage();
    },
    [showDeboucedMessage],
  );

  return (
    <React.Fragment>
      {showMessage && (
        <StyledText fontSize={30} color={theme.colors.WHITE}>
          Something called after debouce.
        </StyledText>
      )}
      <SearchInput
        placeholder="Search for patients"
        value={text}
        onChangeText={onChangeText}
      />
    </React.Fragment>
  );
}
