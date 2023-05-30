import React, { ReactElement } from 'react';
import { StyledView, StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

// Desktop/Mobile duplicated
const COLORS = {
  green: '#83d452',
  yellow: '#ffea5a',
  orange: '#fe8c00',
  red: '#ff2222',
  deepred: '#971a1a',
  purple: '#971a1a',
};

function separateColorText(
  resultText,
): { color: string; strippedResultText: string } {
  for (const [key, color] of Object.entries(COLORS)) {
    // only match colors at the end that follow a result
    // "90% GREEN" -> "90%"
    // "blue ribbon" -> "blue ribbon"
    // "reduced risk" -> "reduced risk"
    const re = RegExp(` ${key}$`, 'i');
    if (resultText.match(re)) {
      const strippedResultText = resultText.replace(re, '').trim();
      return { color, strippedResultText };
    }
  }
  return {
    color: theme.colors.WHITE,
    strippedResultText: resultText,
  };
}

export const SurveyResultBadge = ({ resultText }): ReactElement => {
  const { color, strippedResultText } = separateColorText(resultText);
  return (
    <StyledView
      paddingLeft="6"
      paddingRight="6"
      borderRadius={5}
      background={color}
    >
      <StyledText>{strippedResultText}</StyledText>
    </StyledView>
  );
};
