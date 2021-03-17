import React from 'react';
import { StyledView, StyledText } from '~/ui/styled/common';
import { theme } from '~/ui/styled/theme';

const COLORS = {
  green: '#83d452',
  yellow: '#ffea5a',
  orange: '#fe8c00',
  red: '#ff2222',
  deepred: '#971a1a',
  purple: '#971a1a',
};

// TODO: read color coding string from survey instead of hardcoded
const CODING_STRING = 'green 10 yellow 20 orange 30 red 40 deepred';

function parseThresholdString(s): { colors: string[]; thresholds: any[] } {
  const colors = [];
  const thresholds = [];

  const parts = s
    .split(' ')
    .map(x => x.trim())
    .filter(x => x);
  colors.push(parts.shift());
  while (parts.length > 0) {
    const threshold = parseFloat(parts.shift());
    const color = parts.shift();
    colors.push(color);
    thresholds.push(threshold);
  }

  return { colors, thresholds };
}

function getColorForValue(result, thresholdString): string {
  const { colors, thresholds } = parseThresholdString(thresholdString);
  for (let i = 0; i < thresholds.length; ++i) {
    if (result < thresholds[i]) {
      return colors[i];
    }
  }
  return colors[colors.length - 1];
}

function separateColorText(resultText): { color: string, strippedResultText: string } {
  for (const [key, color] of Object.entries(COLORS)) {
    const re = RegExp(key, "i");
    if(resultText.match(re)) {
      const strippedResultText = resultText.replace(re, '').trim();
      return { color, strippedResultText };
    }
  }
  return {
    color: theme.colors.WHITE,
    strippedResultText: resultText,
  };
}

export const SurveyResultBadge = ({ result, resultText }): JSX.Element => {
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
