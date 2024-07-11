import * as React from 'react';
import { assert, describe, it, vi } from 'vitest';
import { createTheme } from '@material-ui/core/styles';
import { render as baseRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { DownloadDataButton } from '../../../app/components/Table/DownloadDataButton';
import { TranslationContext } from '../../../app/contexts/Translation';
import * as XLSX from 'xlsx';

/** Stub `saveFile` to prevent `URL.createObjectURL` erroring in test environment */
vi.mock('../../../app/utils/fileSystemAccess.js', async () => {
  const actual = await vi.importActual('../../../app/utils/fileSystemAccess.js');
  return {
    ...actual,
    saveFile: vi.fn().mockImplementation(() => {}),
  };
});

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
const sheetToJsonSpy = vi.spyOn(XLSX.utils, 'json_to_sheet');

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
  'general.localisedField.culturalName.label.short': '🌐 Cultural name 🌐',
  'general.localisedField.displayId.label.short': '🌐 NHN 🌐',
  'general.localisedField.sex.label': '🌐 Sex 🌐',
  'patient.property.sex.female': '🌐 Female 🌐',
};

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

  it('renders without throwing errors', async () => {
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
    const renderButton = () =>
      render(<DownloadDataButton exportName="Export" columns={columns} data={data} />);

    assert.doesNotThrow(renderButton, Error);
  });

  it('transforms the data correctly for creating an XLSX worksheet', async () => {
    const user = userEvent.setup();
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
    ];
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
    const expectedData = data.map(({ displayId, culturalName, dateOfBirth }) => ({
      culturalName,
      dateOfBirth,
      displayId,
    }));
    const expectedOptions = { header: ['displayId', 'culturalName', 'dateOfBirth'] };

    render(<DownloadDataButton columns={columns} data={data} exportName="Export" />);
    const button = screen.getByTestId('download-data-button');
    await user.click(button);

    expect(sheetToJsonSpy).toHaveBeenCalledTimes(1);
    expect(sheetToJsonSpy).toHaveBeenCalledWith(expectedData, expectedOptions);
  });

  it('exports <TranslatedText> as a translated string', () => {});

  it('exports <TranslatedReference> as a translated string', () => {});

  it('exports <TranslatedSex> as a translated string', async () => {
    const user = userEvent.setup();
    const columns = [
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
      },
    ];
    const data = [
      {
        id: '00000000-0000-0000-0000-000000000000',
        sex: 'female',
      },
    ];
    getTranslationSpy.mockReturnValueOnce('🌐 Sex 🌐').mockReturnValueOnce('🌐 Female 🌐');
    const expectedData = [{ sex: '🌐 Female 🌐' }];
    const expectedOptions = { header: ['🌐 Sex 🌐'] };

    render(<DownloadDataButton columns={columns} data={data} exportName="Export" />);
    const button = screen.getByTestId('download-data-button');
    await user.click(button);

    expect(sheetToJsonSpy).toHaveBeenCalledTimes(1);
    expect(sheetToJsonSpy).toHaveBeenCalledWith(expectedData, expectedOptions);
  });

  it('exports <TranslatedEnum> as a translated string', () => {});

  it('exports <LocationCell> as a translated string', () => {});

  it('exports <TranslatedText> wrapped in a tooltip without its tooltip', () => {});

  it('exports a non-<TranslatedText> faithfully', () => {});

  it('exports a primitive string faithfully', () => {});
});
