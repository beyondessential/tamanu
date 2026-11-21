import * as React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { replaceStringVariables } from '@tamanu/shared/utils/translation/translationFactory';
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
  // No translations are loaded, so every string resolves to its fallback. Replacements still go
  // through the real substitution, so a test reads the copy a user would rather than its template.
  const mockGetTranslation = (_stringId, fallback, translationOptions) =>
    replaceStringVariables(fallback, translationOptions, {});

  return {
    getTranslation: vi.fn().mockImplementation(mockGetTranslation),
    updateStoredLanguage: () => {},
    storedLanguage: 'aa',
    translations: {},
  };
};

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
