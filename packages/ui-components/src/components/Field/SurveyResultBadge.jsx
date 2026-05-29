import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '../../constants';

/** @privateRemarks Web/Mobile duplicated, but with slightly different values for each key. */
const colors = /** @type {const} */ ({
  green: TAMANU_COLORS.green,
  yellow: TAMANU_COLORS.metallicYellow,
  orange: TAMANU_COLORS.orange,
  red: '#bc261a',
  deepred: '#8c1b25',
  purple: '#67361b',
});

const Badge = styled.span`
  background-color: oklch(from currentColor l c h / 10%);
  border-radius: calc(infinity * 1px);
  display: inline-block;
  min-inline-size: 4em;
  padding-block: 6px;
  padding-inline: 11px;
  text-align: center;
  text-wrap: balance;
`;

function separateColorText(resultText) {
  for (const [key, color] of Object.entries(colors)) {
    // only match colors at the end that follow a result
    // "90% GREEN" → "90%"
    // "blue ribbon" → "blue ribbon"
    // "reduced risk" → "reduced risk"
    const re = RegExp(` ${key}$`, 'i');
    if (resultText.match(re)) {
      const strippedResultText = resultText.replace(re, '').trim();
      return { color, strippedResultText };
    }
  }
  return {
    color: TAMANU_COLORS.darkestText,
    strippedResultText: resultText,
  };
}

export const SurveyResultBadge = ({ resultText, style, ...props }) => {
  if (!resultText) return null;

  const { color, strippedResultText } = separateColorText(resultText);
  return (
    <Badge data-testid="coloredbadge-y3r7" style={{ color, ...style }} {...props}>
      {strippedResultText}
    </Badge>
  );
};
