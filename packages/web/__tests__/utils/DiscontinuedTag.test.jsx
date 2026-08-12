import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../helpers';
import { DiscontinuedTag } from '../../app/utils/medications';

const translationContext = {
  // Mirror the real helper closely enough to resolve `:token` replacements in fallbacks.
  getTranslation: (_stringId, fallback, options) =>
    Object.entries(options?.replacements ?? {}).reduce(
      (text, [key, value]) => text.replaceAll(`:${key}`, `${value}`),
      fallback,
    ),
  getEnumTranslation: (enumValues, value) => enumValues?.[value] ?? value,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderTag = prescription =>
  renderElementWithTranslatedText(
    <DiscontinuedTag prescription={prescription} formatShort={date => `formatted(${date})`} />,
    undefined,
    translationContext,
  );

describe('DiscontinuedTag', () => {
  it('renders nothing for a prescription that has not been discontinued', () => {
    const { container } = renderTag({ id: 'p1', discontinued: false });
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when there is no prescription', () => {
    const { container } = renderTag(undefined);
    expect(container.innerHTML).toBe('');
  });

  it('flags a discontinued prescription', () => {
    renderTag({ id: 'p1', discontinued: true });
    expect(screen.getByText('Discontinued')).toBeDefined();
  });

  it('still flags a discontinued prescription with no date or reason recorded', () => {
    renderTag({ id: 'p1', discontinued: true, discontinuedDate: null, discontinuingReason: null });
    expect(screen.getByText('Discontinued')).toBeDefined();
  });
});
