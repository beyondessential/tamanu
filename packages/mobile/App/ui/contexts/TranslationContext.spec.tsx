import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { DEFAULT_LANGUAGE_CODE, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';
import { TranslationProvider, useTranslation } from './TranslationContext';
import useLanguageOptionsQuery, {
  useLocalLanguageOptionsQuery,
} from '../hooks/queries/useLanguageOptionsQuery';
import { Database } from '~/infra/db';
import { readConfig, writeConfig } from '~/services/config';

jest.mock('~/infra/db', () => ({
  Database: {
    models: {
      TranslatedString: {
        getForLanguage: jest.fn(),
        getLanguageOptions: jest.fn(),
      },
    },
  },
}));

jest.mock('~/services/config', () => ({
  readConfig: jest.fn(),
  writeConfig: jest.fn(),
}));

// TanStack Query resolves queries via timers that the globally enabled fake timers would stall
jest.useRealTimers();

const mockGetForLanguage = Database.models.TranslatedString.getForLanguage as jest.Mock;
const mockGetLanguageOptions = Database.models.TranslatedString.getLanguageOptions as jest.Mock;
const mockReadConfig = readConfig as jest.Mock;
const mockWriteConfig = writeConfig as jest.Mock;
const mockFetch = jest.fn();

// gcTime: 0 so no garbage-collection timers outlive the tests and keep jest from exiting
const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

const createProviderWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>{children}</TranslationProvider>
    </QueryClientProvider>
  );
};

const createQueryClientWrapper = () => {
  const queryClient = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

beforeAll(() => {
  global.fetch = mockFetch as unknown as typeof fetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockReadConfig.mockResolvedValue(ENGLISH_LANGUAGE_CODE);
  mockGetForLanguage.mockResolvedValue({});
  mockGetLanguageOptions.mockResolvedValue([]);
});

describe('TranslationProvider', () => {
  it('serves translations from the local database when they exist', async () => {
    mockGetForLanguage.mockResolvedValue({ 'login.heading': 'Kia ora' });

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() =>
      expect(result.current.getTranslation('login.heading', 'Welcome')).toBe('Kia ora'),
    );
    expect(mockGetForLanguage).toHaveBeenCalledWith(ENGLISH_LANGUAGE_CODE);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('falls back to the public endpoint when the local database is empty and a host is set', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ 'login.heading': 'Bula' }),
    });

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });
    await waitFor(() => expect(result.current.language).toBe(ENGLISH_LANGUAGE_CODE));

    await act(() => result.current.setHost('https://central.example'));

    await waitFor(() =>
      expect(result.current.getTranslation('login.heading', 'Welcome')).toBe('Bula'),
    );
    expect(mockFetch).toHaveBeenCalledWith('https://central.example/api/public/translation/en');
  });

  it('serves fallbacks when the local database is empty and no host is set', async () => {
    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(mockGetForLanguage).toHaveBeenCalled());
    expect(result.current.getTranslation('login.heading', 'Welcome')).toBe('Welcome');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('persists an explicit language change and loads that language', async () => {
    mockGetForLanguage.mockImplementation(async (languageCode: string) =>
      languageCode === 'fr' ? { 'login.heading': 'Bonjour' } : {},
    );

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });
    await waitFor(() => expect(result.current.language).toBe(ENGLISH_LANGUAGE_CODE));

    await act(() => result.current.setLanguage('fr'));

    expect(mockWriteConfig).toHaveBeenCalledWith('language', 'fr');
    await waitFor(() =>
      expect(result.current.getTranslation('login.heading', 'Welcome')).toBe('Bonjour'),
    );
  });

  it('does not rewrite the language config when only restoring it', async () => {
    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(result.current.language).toBe(ENGLISH_LANGUAGE_CODE));
    expect(mockWriteConfig).not.toHaveBeenCalled();
  });

  it('falls back to English, without persisting it, when the stored language is unavailable', async () => {
    // The fallback must not depend on where English sits in the list
    mockReadConfig.mockResolvedValue('xx');
    mockGetLanguageOptions.mockResolvedValue([
      { label: 'Français', languageCode: 'fr', countryCode: 'fr' },
      { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
    ]);

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(result.current.language).toBe(ENGLISH_LANGUAGE_CODE));
    expect(mockGetForLanguage).toHaveBeenCalledWith(ENGLISH_LANGUAGE_CODE);
    expect(mockWriteConfig).not.toHaveBeenCalled();
  });

  it('falls back to the first available language when the stored one is unavailable and English is not offered', async () => {
    mockReadConfig.mockResolvedValue('xx');
    mockGetLanguageOptions.mockResolvedValue([
      { label: 'Français', languageCode: 'fr', countryCode: 'fr' },
      { label: 'Te reo Māori', languageCode: 'mi', countryCode: 'nz' },
    ]);

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(result.current.language).toBe('fr'));
    expect(mockGetForLanguage).toHaveBeenCalledWith('fr');
    expect(mockWriteConfig).not.toHaveBeenCalled();
  });

  it('shows the locally synced languages when the selected server is unreachable, without touching the stored language', async () => {
    mockReadConfig.mockResolvedValue('fr');
    mockGetLanguageOptions.mockResolvedValue([
      { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
    ]);
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });
    await waitFor(() => expect(result.current.languageOptions).toHaveLength(1));

    await act(() => result.current.setHost('https://central.example'));

    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        'https://central.example/api/public/translation/languageOptions',
      ),
    );
    // Only the synced-down English is on offer, so it is shown — but the stored French survives
    expect(result.current.languageOptions).toEqual([
      { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
    ]);
    expect(result.current.language).toBe(ENGLISH_LANGUAGE_CODE);
    expect(mockWriteConfig).not.toHaveBeenCalled();
  });

  it('reports the language options as pending until a source answers', async () => {
    let resolveLanguageOptions: (options: unknown[]) => void;
    mockGetLanguageOptions.mockReturnValue(
      new Promise(resolve => {
        resolveLanguageOptions = resolve;
      }),
    );

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    expect(result.current.languageOptionsStatus).toBe('pending');

    await act(async () => {
      resolveLanguageOptions([
        { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
      ]);
    });

    await waitFor(() => expect(result.current.languageOptionsStatus).toBe('success'));
  });

  it('distinguishes an empty language list from a failure to load one', async () => {
    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(result.current.languageOptionsStatus).toBe('success'));
    expect(result.current.languageOptions).toEqual([]);
  });

  it('reports an error when neither the server nor the local database can offer a list', async () => {
    mockGetLanguageOptions.mockRejectedValue(new Error('no such table'));
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(result.current.languageOptionsStatus).toBe('error'));
    expect(result.current.languageOptions).toBeUndefined();
  });

  it('keeps the stored language when it is one of the available options', async () => {
    mockReadConfig.mockResolvedValue('fr');
    mockGetLanguageOptions.mockResolvedValue([
      { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
      { label: 'Français', languageCode: 'fr', countryCode: 'fr' },
    ]);

    const { result } = await renderHook(() => useTranslation(), {
      wrapper: createProviderWrapper(),
    });

    await waitFor(() => expect(result.current.languageOptions).toHaveLength(2));
    expect(result.current.language).toBe('fr');
    expect(mockWriteConfig).not.toHaveBeenCalled();
  });
});

describe('useLocalLanguageOptionsQuery', () => {
  it('returns local language options, hiding the default language when a custom English exists', async () => {
    mockGetLanguageOptions.mockResolvedValue([
      { label: 'English (default)', languageCode: DEFAULT_LANGUAGE_CODE, countryCode: '' },
      { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
      { label: 'Français', languageCode: 'fr', countryCode: 'fr' },
    ]);

    const { result } = await renderHook(() => useLocalLanguageOptionsQuery(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { label: 'English', languageCode: ENGLISH_LANGUAGE_CODE, countryCode: 'gb' },
      { label: 'Français', languageCode: 'fr', countryCode: 'fr' },
    ]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns an empty list when nothing is synced', async () => {
    const { result } = await renderHook(() => useLocalLanguageOptionsQuery(), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('useLanguageOptionsQuery', () => {
  it('does nothing when no host is set', async () => {
    const { result } = await renderHook(() => useLanguageOptionsQuery(null), {
      wrapper: createQueryClientWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockGetLanguageOptions).not.toHaveBeenCalled();
  });

  it('fetches the selected server’s language options when a host is set', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        languageNames: [{ language: 'fr', text: 'Français' }],
        languagesInDb: [{ language: 'fr' }],
        countryCodes: [{ language: 'fr', text: 'fr' }],
      }),
    });

    const { result } = await renderHook(() => useLanguageOptionsQuery('https://central.example'), {
      wrapper: createQueryClientWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { label: 'Français', languageCode: 'fr', countryCode: 'fr' },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://central.example/api/public/translation/languageOptions',
    );
  });

  it('surfaces a failed fetch as an error rather than substituting the local list', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    const { result } = await renderHook(
      () => useLanguageOptionsQuery('https://central.example', { retry: false }),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(mockGetLanguageOptions).not.toHaveBeenCalled();
  });
});
