/*
 * Tests the rendering and translation of the ‘Export’ button itself.
 *
 * Unfortunately does nothing to test that data is exported correctly because of the challenges
 * involved with getting `renderToText` in /app/utils to work in the testing environment. If you
 * decide to re-attempt a more comprehensive testing suite, this commit may be worth looking at:
 * https://github.com/beyondessential/tamanu/blob/b692d02ef28f7d654003659a3bf93b1b9b702ba6/packages/web/__tests__/components/Table/DownloadDataButton.test.jsx
 */

import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import * as React from 'react';
import { assert, describe, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { DownloadDataButton } from '../../../app/components/Table/DownloadDataButton';
import {
  culturalName,
  dateOfBirth,
  displayId,
  firstName,
  lastName,
  markedForSync,
  sex,
  village,
} from '../../../app/views/patients/columns';
import { renderElementWithTranslatedText } from '../../helpers';

/** Stub `saveFile` to prevent `URL.createObjectURL` erroring in test environment */
vi.mock('../../../app/utils/fileSystemAccess.js', async () => {
  const actual = await vi.importActual('../../../app/utils/fileSystemAccess.js');
  return {
    ...actual,
    saveFile: vi.fn().mockImplementation(() => {}),
  };
});

const mockTranslations = { 'general.table.action.export': '🌐 Export 🌐' };
// eslint-disable-next-line no-unused-vars
const mockGetTranslation = (stringId, fallback, _replacements, _uppercase, _lowercase) =>
  mockTranslations[stringId] ?? fallback;
const mockTranslationContext = {
  getTranslation: vi.fn().mockImplementation(mockGetTranslation),
  updateStoredLanguage: () => {},
  storedLanguage: 'aa',
  translations: mockTranslations,
};

const getTranslationSpy = vi.spyOn(mockTranslationContext, 'getTranslation');
const sheetToJsonSpy = vi.spyOn(XLSX.utils, 'json_to_sheet');

/** {@link DownloadDataButton} must be rendered within a translation context */
const render = element => renderElementWithTranslatedText(element, null, mockTranslationContext);

describe('DownloadDataButton', () => {
  const columns = [
    culturalName,
    dateOfBirth,
    displayId,
    firstName,
    lastName,
    markedForSync,
    sex,
    village,
  ];
  const data = [
    {
      id: '5d9bf276-c93e-4f23-b77a-e3509541b77b',
      sex: 'male',
      encounterId: 'bc86d214-de36-4363-b741-616086be76fe',
      encounterType: 'admission',
      markedForSync: true,
      displayId: 'MACF991194',
      firstName: 'Rahul',
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
  ];

  it('renders without throwing errors', async () => {
    const renderButton = () =>
      render(<DownloadDataButton exportName="Export" columns={columns} data={data} />);

    assert.doesNotThrow(renderButton, Error);
  });

  it('is rendered with a translated button label', () => {
    render(<DownloadDataButton exportName="Export" columns={columns} data={data} />);

    const button = screen.getByTestId('download-data-button');
    expect(getTranslationSpy).toHaveBeenCalledTimes(1);
    expect(getTranslationSpy).toHaveBeenCalledWith(
      'general.table.action.export',
      'Export',
      undefined,
      undefined,
      undefined,
    );
    expect(button.textContent).toBe('🌐 Export 🌐');
  });

  it('does attempt to generate a spreadsheet', async () => {
    const user = userEvent.setup();
    render(<DownloadDataButton exportName="Export" columns={columns} data={data} />);

    const button = screen.getByTestId('download-data-button');
    await user.click(button);

    // Ideally this would check the arguments with which the spy is called, but those objects depend
    // on `renderToText` working in this testing environment
    expect(sheetToJsonSpy).toHaveBeenCalledTimes(1);
  });
});
