import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';

const COLORS = {
  green: '#83d452',
  yellow: '#ffea5a',
  orange: '#fe8c00',
  red: '#ff2222',
  deepred: '#971a1a',
};

const ColoredBadge = styled.div`
  background: ${p => p.color};
  border-radius: 0.5rem;
  text-align: center;
`;

function separateColorText(resultText) {
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
    color: Colors.white,
    strippedResultText: resultText,
  };
}

export const SurveyResultBadge = ({ resultText }) => {
  if (!resultText) {
    return null;
  }
  const { color, strippedResultText } = separateColorText(resultText);
  return <ColoredBadge color={color}>{strippedResultText}</ColoredBadge>;
};
