import * as React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { createStore } from 'redux';
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

// A logged-out store, enough for components that read auth state (e.g. tables reading the
// current user's remembered page size). Tests needing particular state provide their own.
const createStubStore = () => createStore(() => ({ auth: {} }));

/** The “minimum” context providers needed to render `<TranslatedText>` elements. */
const CompositeTranslationProvider = ({
  translationContext = createStubTranslationContext(),
  children,
}) => (
  <ReduxProvider store={createStubStore()}>
    <QueryClientProvider client={createQueryClient()}>
      <ThemeProvider theme={createStubTheme()}>
        <TranslationProvider value={translationContext}>
          {children}
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ReduxProvider>
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
