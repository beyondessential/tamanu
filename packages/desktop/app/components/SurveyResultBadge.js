import React from 'react';
import styled from 'styled-components';

const COLORS = {
  green: '#83d452',
  yellow: '#ffda5a',
  red: '#ff2222',
};

const ColoredBadge = styled.div`
  background: ${p => p.color};
  border-radius: 0.5rem;
  text-align: center;
`;

// TODO: read color coding string from survey instead of hardcoded
const CODING_STRING = 'green 25 yellow 50 red';

function parseThresholdString(s) {
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

function getColorForValue(result, thresholdString) {
  const { colors, thresholds } = parseThresholdString(thresholdString);
  for (let i = 0; i < thresholds.length; ++i) {
    if (result < thresholds[i]) {
      return colors[i];
    }
  }
  return colors[colors.length - 1];
}

export const SurveyResultBadge = ({ result }) => {
  const colorName = getColorForValue(result, CODING_STRING);
  return <ColoredBadge color={COLORS[colorName]}>{result}</ColoredBadge>;
};
