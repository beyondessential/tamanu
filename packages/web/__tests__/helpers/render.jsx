import * as React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { TranslationProvider } from '../../app/contexts/Translation';
import { createTheme } from '@material-ui/core/styles';
import { vi } from 'vitest';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

export const createStubTheme = () => createTheme({});

const createStubTranslationContext = () => {
  // eslint-disable-next-line no-unused-vars
  const mockGetTranslation = (_stringId, fallback, _translationOptions) => fallback;

  return {
    getTranslation: vi.fn().mockImplementation(mockGetTranslation),
    updateStoredLanguage: () => {},
    storedLanguage: 'aa',
    translations: {},
  };
};

/**
 * A translation context that fills in replacements and translates enum values to their labels, for
 * tests asserting on text assembled from both, such as "Above expected max of 2 tablets".
 */
export const createTranslationContextWithReplacements = () => ({
  getTranslation: (_stringId, fallback, { replacements = {} } = {}) =>
    Object.entries(replacements).reduce(
      (text, [key, value]) => text.replaceAll(`:${key}`, String(value)),
      fallback,
    ),
  getEnumTranslation: (enumValues, value) => enumValues[value],
  getReferenceDataTranslation: ({ fallback }) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'aa',
  translations: {},
});

/** The “minimum” context providers needed to render `<TranslatedText>` elements. */
const CompositeTranslationProvider = ({
  translationContext = createStubTranslationContext(),
  children,
}) => (
  <QueryClientProvider client={createQueryClient()}>
    <ThemeProvider theme={createStubTheme()}>
      <TranslationProvider value={translationContext}>
        {children}
      </TranslationProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export function renderElementWithTranslatedText(element, renderOptions, translationContext) {
  return render(element, {
    wrapper: ({ children }) => (
      <CompositeTranslationProvider translationContext={translationContext}>
        {children}
      </CompositeTranslationProvider>
    ),
    ...renderOptions,
  });
}
