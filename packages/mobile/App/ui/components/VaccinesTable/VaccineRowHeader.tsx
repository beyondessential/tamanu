import React from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { TranslatedTextElement } from '../Translations/TranslatedText';

interface VaccineRowHeaderProps {
  title: string;
  subtitle?: TranslatedTextElement;
}

export const VaccineRowHeader = React.memo(
  ({ title, subtitle }: VaccineRowHeaderProps): JSX.Element => (
    <StyledView
      width={130}
      borderRightWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
      background={theme.colors.BACKGROUND_GREY}
      borderBottomWidth={1}
      paddingLeft={15}
      height={80}
      justifyContent="center"
    >
      <StyledText fontSize={13} color={theme.colors.TEXT_SUPER_DARK}>
        {title}
      </StyledText>
      {subtitle && (
        <StyledText fontSize={13} color={theme.colors.TEXT_MID}>
          {subtitle}
        </StyledText>
      )}
    </StyledView>
  ),
);
