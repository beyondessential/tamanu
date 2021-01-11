import React from 'react';
import { StyledView, StyledText } from '/styled/common';

const COLORS = {
  green: '#83d452',
  yellow: '#ffea5a',
  orange: '#fe8c00',
  red: '#ff2222',
  deepred: '#971a1a',
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

export const SurveyResultBadge = ({ result }): JSX.Element => {
  if (!result && result !== 0) {
    return null;
  }
  const colorName = getColorForValue(result, CODING_STRING);
  const text = `${result}`;
  return (
    <StyledView
      paddingLeft="6"
      paddingRight="6"
      borderRadius={5}
      background={COLORS[colorName]}
    >
      <StyledText>{result}</StyledText>
    </StyledView>
  );
};
