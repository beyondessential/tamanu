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

/** Dictionary mapping string IDs to translations. */
const translatedStrings = {
  'general.localisedField.culturalName.label.short': '🌐 Cultural name 🌐',
  'general.localisedField.displayId.label.short': '🌐 NHN 🌐',
  'general.localisedField.sex.label': '🌐 Sex 🌐',
  'patient.property.sex.female': '🌐 Female 🌐',
  'refData.settlement.settlement-nasaga': '🌐 Nasaga 🌐',
  'general.table.action.export': '🌐 Export 🌐',
};

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

/** {@link DownloadDataButton} must  be rendered within a translation context */
const render = (element, options) => baseRender(element, { wrapper: Providers, ...options });

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

  it('is rendered with a translated button label', () => {
    render(<DownloadDataButton exportName="Export" columns={[]} data={[]} />);
    const button = screen.getByTestId('download-data-button');
    expect(getTranslationSpy).toHaveBeenCalledWith(
      'general.table.action.export',
      'Export',
      undefined,
      undefined,
      undefined,
    );
    expect(button.textContent).toBe('🌐 Export 🌐');
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
        key: 'markedForSync',
        title: {
          key: null,
          ref: null,
          props: {
            stringId: 'general.localisedField.markedForSync.label.short',
            fallback: 'Sync',
          },
          _owner: null,
          _store: {},
        },
        minWidth: 26,
        CellComponent: {
          compare: null,
        },
        sortable: false,
      },
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
        key: 'firstName',
        title: {
          key: null,
          ref: null,
          props: {
            stringId: 'general.localisedField.firstName.label',
            fallback: 'First name',
          },
          _owner: null,
          _store: {},
        },
        minWidth: 100,
      },
      {
        key: 'lastName',
        title: {
          key: null,
          ref: null,
          props: {
            stringId: 'general.localisedField.lastName.label',
            fallback: 'Last name',
          },
          _owner: null,
          _store: {},
        },
        minWidth: 100,
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
      {
        key: 'villageName',
        title: {
          key: null,
          ref: null,
          props: {
            stringId: 'general.localisedField.villageId.label',
            fallback: 'Village',
          },
          _owner: null,
          _store: {},
        },
        minWidth: 100,
      },
      {
        key: 'patientStatus',
        title: {
          key: null,
          ref: null,
          props: {
            stringId: 'general.status.label',
            fallback: 'Status',
          },
          _owner: null,
          _store: {},
        },
        sortable: false,
        minWidth: 100,
      },
    ];
    const data = [
      {
        id: '5d9bf276-c93e-4f23-b77a-e3509541b77b',
        sex: 'male',
        encounterId: 'bc86d214-de36-4363-b741-616086be76fe',
        encounterType: 'admission',
        markedForSync: true,
        displayId: 'MACF991194',
        firstName: 'Rahul ',
        lastName: '2.9',
        dateOfBirth: '1995-07-11',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-07-02T00:38:04.377Z',
        updatedAt: '2024-07-02T00:38:04.377Z',
      },
      {
        id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
        sex: 'other',
        encounterId: '31466555-fbd1-4d91-8e17-b5904acd9c4e',
        encounterType: 'admission',
        villageName: 'Nasaga',
        markedForSync: true,
        displayId: 'ZLTH247813',
        firstName: 'Roy',
        middleName: 'Ernest',
        lastName: 'Antonini',
        culturalName: 'Joe',
        dateOfBirth: '1981-10-27',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-07-09T03:19:02.708Z',
        villageId: 'village-Nasaga',
      },
      {
        id: 'b7800158-d575-415c-8a7a-cf97a2e1e63f',
        sex: 'female',
        encounterId: '4e5409e9-af66-45ad-b795-3289969ab350',
        encounterType: 'triage',
        villageName: 'Nabualau',
        markedForSync: true,
        displayId: 'SCGH129788',
        firstName: 'Margaret',
        middleName: 'Ruby',
        lastName: 'Ballard',
        culturalName: 'Willie',
        dateOfBirth: '1984-09-22',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Nabualau',
      },
      {
        id: 'ee4ecd50-763c-4fe6-81e1-0ea10a3f1daf',
        sex: 'female',
        encounterId: 'e91b08b2-2137-4c24-acc7-a16873625eeb',
        encounterType: 'clinic',
        villageName: 'Nagadoa',
        markedForSync: true,
        displayId: 'NPJM211479',
        firstName: 'Caroline',
        middleName: 'Mathilda',
        lastName: 'Bini',
        culturalName: 'Nell',
        dateOfBirth: '1950-03-20',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Nagadoa',
      },
      {
        id: '13466964-5879-4f7a-b225-91dea96dae0f',
        email: 'da@bes.au',
        sex: 'female',
        markedForSync: false,
        displayId: 'OBIC565949',
        firstName: 'Da',
        lastName: 'Birth',
        dateOfBirth: '2024-05-31',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-07-02T00:38:04.377Z',
        updatedAt: '2024-07-02T00:38:04.377Z',
      },
      {
        id: 'dc3d9910-66ea-4722-9d61-8264acb9db15',
        sex: 'female',
        villageName: 'Nasaumatua',
        markedForSync: false,
        displayId: 'UAIC499076',
        firstName: 'Eugenia',
        middleName: 'Mattie',
        lastName: 'Bosman',
        culturalName: 'Nancy',
        dateOfBirth: '1941-07-26',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Nasaumatua',
      },
      {
        id: '3b589ab6-7cc4-4f2c-9f80-df1aceb5b7a6',
        sex: 'male',
        villageName: 'Matacula',
        markedForSync: false,
        displayId: 'PVXC755243',
        firstName: 'Jack',
        middleName: 'Seth',
        lastName: 'Bouma',
        culturalName: 'Matthew',
        dateOfBirth: '1959-02-20',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Matacula',
      },
      {
        id: 'bfa603fe-7186-4d44-8d4a-0eaf3fb33b75',
        sex: 'female',
        villageName: 'Nabilo Settlement',
        markedForSync: false,
        displayId: 'AVBB712842',
        firstName: 'Marion',
        middleName: 'Georgie',
        lastName: 'Burke',
        culturalName: 'Jeanette',
        dateOfBirth: '1989-08-01',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-NabiloSettlement',
      },
      {
        id: '50e7046b-81c3-4c16-90e9-a184c6fab37f',
        sex: 'female',
        villageName: 'Nabualau',
        markedForSync: false,
        displayId: 'NKXY042240',
        firstName: 'Lucile',
        middleName: 'Willie',
        lastName: 'Ceni',
        culturalName: 'Bettie',
        dateOfBirth: '1952-06-03',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Nabualau',
      },
      {
        id: '58170297-d96b-45b6-bb27-ba9522b87be2',
        sex: 'male',
        villageName: 'Naqarawai',
        markedForSync: false,
        displayId: 'HPUS623485',
        firstName: 'Floyd',
        middleName: 'Clayton',
        lastName: 'Chandler',
        culturalName: 'Antonio',
        dateOfBirth: '1963-01-09',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Naqarawai',
      },
    ];
    const expectedData = [
      {
        Sync: true,
        NHN: 'MACF991194',
        'First name': 'Rahul ',
        'Last name': '2.9',
        DOB: '1995-07-11',
        Sex: 'male',
        Village: '',
        Status: 'Inpatient',
      },
      {
        Sync: true,
        NHN: 'ZLTH247813',
        'First name': 'Roy',
        'Last name': 'Antonini',
        'Cultural name': 'Joe',
        DOB: '1981-10-27',
        Sex: 'other',
        Village: 'NASAGA',
        Status: 'Inpatient',
      },
      {
        Sync: true,
        NHN: 'SCGH129788',
        'First name': 'Margaret',
        'Last name': 'Ballard',
        'Cultural name': 'Willie',
        DOB: '1984-09-22',
        Sex: 'female',
        Village: 'NABUALAU',
        Status: 'Emergency',
      },
      {
        Sync: true,
        NHN: 'NPJM211479',
        'First name': 'Caroline',
        'Last name': 'Bini',
        'Cultural name': 'Nell',
        DOB: '1950-03-20',
        Sex: 'female',
        Village: 'NAGADOA',
        Status: 'Outpatient',
      },
      {
        Sync: false,
        NHN: 'OBIC565949',
        'First name': 'Da',
        'Last name': 'Birth',
        DOB: '2024-05-31',
        Sex: 'female',
        Village: '',
        Status: '',
      },
      {
        Sync: false,
        NHN: 'UAIC499076',
        'First name': 'Eugenia',
        'Last name': 'Bosman',
        'Cultural name': 'Nancy',
        DOB: '1941-07-26',
        Sex: 'female',
        Village: 'NASAUMATUA',
        Status: '',
      },
      {
        Sync: false,
        NHN: 'PVXC755243',
        'First name': 'Jack',
        'Last name': 'Bouma',
        'Cultural name': 'Matthew',
        DOB: '1959-02-20',
        Sex: 'male',
        Village: 'MATACULA',
        Status: '',
      },
      {
        Sync: false,
        NHN: 'AVBB712842',
        'First name': 'Marion',
        'Last name': 'Burke',
        'Cultural name': 'Jeanette',
        DOB: '1989-08-01',
        Sex: 'female',
        Village: 'NABILO SETTLEMENT',
        Status: '',
      },
      {
        Sync: false,
        NHN: 'NKXY042240',
        'First name': 'Lucile',
        'Last name': 'Ceni',
        'Cultural name': 'Bettie',
        DOB: '1952-06-03',
        Sex: 'female',
        Village: 'NABUALAU',
        Status: '',
      },
      {
        Sync: false,
        NHN: 'HPUS623485',
        'First name': 'Floyd',
        'Last name': 'Chandler',
        'Cultural name': 'Antonio',
        DOB: '1963-01-09',
        Sex: 'male',
        Village: 'NAQARAWAI',
        Status: '',
      },
    ];
    const expectedOptions = {
      header: [
        'Sync',
        'NHN',
        'First name',
        'Last name',
        'Cultural name',
        'DOB',
        'Sex',
        'Village',
        'Status',
      ],
    };

    render(<DownloadDataButton columns={columns} data={data} exportName="Export" />);
    const button = screen.getByTestId('download-data-button');
    await user.click(button);

    // expect(getTranslationSpy).toHaveBeenCalledTimes(0);
    expect(sheetToJsonSpy).toHaveBeenCalledTimes(1);
    expect(sheetToJsonSpy).toHaveBeenCalledWith(expectedData, expectedOptions);
  });

  it('exports <TranslatedEnum> as a translated string', () => {});

  it('exports <LocationCell> as a translated string', () => {});

  it('exports <TranslatedText> wrapped in a tooltip without its tooltip', () => {});

  it('exports a non-<TranslatedText> faithfully', () => {});

  it('exports a primitive string faithfully', () => {});
});
