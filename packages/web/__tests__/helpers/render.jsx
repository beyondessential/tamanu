import * as React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, StyledEngineProvider } from 'styled-components';
import { TranslationContext } from '../../app/contexts/Translation';
import { createTheme, adaptV4Theme } from '@mui/material/styles';
import { vi } from 'vitest';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

export const createStubTheme = () => createTheme(adaptV4Theme({}));

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

/** The “minimum” context providers needed to render `<TranslatedText>` elements. */
const CompositeTranslationProvider = ({
  translationContext = createStubTranslationContext(),
  children,
}) => (
  <QueryClientProvider client={createQueryClient()}>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={createStubTheme()}>
        <TranslationContext.Provider value={translationContext}>
          {children}
        </TranslationContext.Provider>
      </ThemeProvider>
    </StyledEngineProvider>
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
