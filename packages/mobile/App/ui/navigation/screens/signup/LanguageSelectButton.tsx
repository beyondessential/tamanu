import React, { useState, ReactElement, useEffect } from 'react';

import { theme } from '~/ui/styled/theme';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledView, StyledTouchableOpacity } from '~/ui/styled/common';
import { readConfig } from '~/services/config';

export const LanguageSelectButton = ({ navigate }): ReactElement => {
  const [language, setLanguage] = useState(null);

  useEffect(() => {
    (async () => {
      const language = await readConfig('language');
      setLanguage(language);
    })();
  }, [])

  // TODO: Fetched from backend   
  const languageNames = {
    en: '🇬🇧 English',
    es: '🇰🇭 Spanish',
  };

  return (
    <StyledTouchableOpacity onPress={navigate}>
      <StyledView
        borderColor="white"
        borderBottomWidth={1}
        width={screenPercentageToDP('20', Orientation.Width)}
        marginLeft={screenPercentageToDP('2.43', Orientation.Width)}
        marginBottom={screenPercentageToDP('5.86', Orientation.Height)}
      >
        <StyledText fontSize={12} color={theme.colors.TEXT_SOFT}>Language</StyledText>
        <StyledText color={theme.colors.WHITE}>{languageNames[language]}</StyledText>
      </StyledView>
    </StyledTouchableOpacity>
  );
};
