import * as React from 'react';
import { assert, describe, it, vi } from 'vitest';
import { createTheme } from '@material-ui/core/styles';
import { render as baseRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { DownloadDataButton } from '../../../app/components/Table/DownloadDataButton';
import { TranslationContext } from '../../../app/contexts/Translation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const stubTheme = createTheme({});

// eslint-disable-next-line no-unused-vars
const mockGetTranslation = (stringId, fallback, _replacements, _uppercase, _lowercase) =>
  translatedStrings[stringId] ?? fallback;
const mockTranslationContext = {
  getTranslation: vi.fn().mockImplementation(mockGetTranslation),
  updateStoredLanguage: () => {},
  storedLanguage: 'aa',
  translations: [],
};
const getTranslationSpy = vi.spyOn(mockTranslationContext, 'getTranslation');

/** The “minimum” context providers needed to render the component under test. */
const Providers = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={stubTheme}>
      <TranslationContext.Provider value={mockTranslationContext}>
        {children}
      </TranslationContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);
const render = (element, options) => baseRender(element, { wrapper: Providers, ...options });

/** Dictionary mapping string IDs to translations. */
const translatedStrings = {
  'general.localisedField.displayId.label.short': 'NHN in another language',
  'general.localisedField.culturalName.label.short': 'Cultural name in another language',
};

/** Mock columns */
const columns = [
  {
    key: 'displayId',
    title: {
      key: null,
      ref: null,
      props: {
        stringId: 'general.localisedField.displayId.label.short',
        fallback: 'NHN',
      },
      _owner: null,
      _store: {},
    },
    minWidth: 80,
  },
  {
    key: 'culturalName',
    title: {
      key: null,
      ref: null,
      props: {
        stringId: 'general.localisedField.culturalName.label.short',
        fallback: 'Cultural name',
      },
      _owner: null,
      _store: {},
    },
    minWidth: 100,
  },
  {
    key: 'dateOfBirth',
    title: {
      key: null,
      ref: null,
      props: {
        stringId: 'general.localisedField.dateOfBirth.label.short',
        fallback: 'DOB',
      },
      _owner: null,
      _store: {},
    },
    minWidth: 100,
    CellComponent: {
      compare: null,
    },
  },
  {
    key: 'sex',
    title: {
      key: null,
      ref: null,
      props: {
        stringId: 'general.localisedField.sex.label',
        fallback: 'Sex',
      },
      _owner: null,
      _store: {},
    },
    minWidth: 80,
    CellComponent: {
      compare: null,
    },
    sortable: false,
  },
];
/** Mock data */
const data = [
  {
    id: '409257d7-5d58-4684-8b32-3ad92cbe6a5e',
    sex: 'female',
    displayId: 'ZZTC137803',
    culturalName: 'Edith',
    dateOfBirth: '1963-01-25',
  },
  {
    id: '4902c05e-468f-470d-93d1-90d0cc9e97bf',
    sex: 'male',
    displayId: 'MEOO646402',
    culturalName: 'Oscar',
    dateOfBirth: '1956-04-10',
  },
];
/** Component under test */
const downloadDataButton = <DownloadDataButton exportName="Export" columns={columns} data={data} />;

describe('DownloadDataButton', () => {
  beforeAll(() => {
    vi.doMock('@tanstack/react-query', async () => {
      const actual = await vi.importActual('@tanstack/react-query');
      return {
        ...actual,
        useQueryClient: vi.fn().mockReturnValue(queryClient),
      };
    });
    vi.doMock('../../../app/contexts/Translation', async () => {
      const actual = await vi.importActual('../../../app/contexts/Translation');
      return {
        ...actual,
        useTranslation: vi.fn().mockReturnValue(mockTranslationContext),
        TranslationProvider: ({ children }) => (
          <TranslationContext.Provider value={mockTranslationContext}>
            {children}
          </TranslationContext.Provider>
        ),
      };
    });
  });

  afterAll(() => {
    vi.doUnmock('@tanstack/react-query');
    vi.doUnmock('../../../app/contexts/Translation');
  });

  it('renders without throwing errors', () => {
    const renderButton = () => render(downloadDataButton);
    assert.doesNotThrow(renderButton, Error);
  });

  it('renders <TranslatedText> to a translated string', async () => {
    getTranslationSpy.mockReturnValue('asdfasf');
    render(downloadDataButton);
    expect(getTranslationSpy).toHaveBeenCalledTimes(2);
  });

  it('renders <TranslatedReference> to a translated string', () => {});

  it('renders <TranslatedEnum> to a translated string', () => {});

  it('renders <LocationCell> to a translated string', () => {});

  it('renders a non-<TranslatedText> element faithfully', () => {});
});
