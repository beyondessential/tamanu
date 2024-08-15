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
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import { DownloadDataButton } from '../../../app/components/Table/DownloadDataButton';
import * as fileSystemAccess from '../../../app/utils/fileSystemAccess';
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
import { randomTestPatient } from '../../helpers/randomTestPatient';

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
const saveFileSpy = vi.spyOn(fileSystemAccess, 'saveFile');

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
  const data = Array.from({ length: 10 }, () => randomTestPatient());

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

  it('does attempt to save a spreadsheet', async () => {
    const user = userEvent.setup();
    render(<DownloadDataButton exportName="test-export-name" columns={columns} data={data} />);

    const button = screen.getByTestId('download-data-button');
    await user.click(button);

    expect(saveFileSpy).toHaveBeenCalledTimes(1);
    expect(saveFileSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        defaultFileName: `test-export-name-${getCurrentDateString()}`,
        extension: 'xlsx',
      }),
    );
  });
});
