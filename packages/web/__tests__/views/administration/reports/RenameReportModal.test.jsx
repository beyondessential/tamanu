import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../../helpers';
import { VersionInfo } from '../../../../app/views/administration/reports/components/VersionInfo';

const patchMock = vi.fn();
const canMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('../../../../app/api', () => ({
  useApi: () => ({ patch: patchMock }),
}));

vi.mock('../../../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: canMock } }),
}));

vi.mock('react-toastify', async importOriginal => ({
  ...(await importOriginal()),
  toast: {
    success: (...args) => toastSuccessMock(...args),
    error: (...args) => toastErrorMock(...args),
  },
}));

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ formatShortestDateTime: value => value }),
}));

const version = {
  versionNumber: 3,
  createdAt: '2026-11-01 10:00:00',
  createdBy: { displayName: 'Report Author' },
  reportDefinition: { id: 'report-1', name: 'Old report name', dbSchema: 'reporting' },
};

const renderVersionInfo = () =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <VersionInfo version={version} />
    </SettingsContext.Provider>,
  );

const openModal = () => fireEvent.click(screen.getByTestId('iconbutton-rename-report'));

const getNameInput = () => screen.getByRole('textbox');

describe('Renaming a report', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hides the rename button from a user who cannot write reports', () => {
    canMock.mockReturnValue(false);
    renderVersionInfo();
    expect(screen.getByText('Old report name')).toBeTruthy();
    expect(screen.queryByTestId('iconbutton-rename-report')).toBeNull();
  });

  it('opens the modal with the current name filled in', async () => {
    canMock.mockReturnValue(true);
    renderVersionInfo();
    openModal();
    expect(await screen.findByText('Rename report')).toBeTruthy();
    expect(getNameInput().value).toBe('Old report name');
  });

  it('saves the trimmed name and closes the modal', async () => {
    canMock.mockReturnValue(true);
    patchMock.mockResolvedValue({ id: 'report-1', name: 'New report name' });
    renderVersionInfo();
    openModal();
    await screen.findByText('Rename report');

    fireEvent.change(getNameInput(), { target: { value: '  New report name  ' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'admin/reports/:reportId',
          params: { reportId: 'report-1' },
        }),
        { name: 'New report name' },
      ),
    );
    await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Rename report')).toBeNull());
  });

  it('keeps the modal open and reports the error when the rename fails', async () => {
    canMock.mockReturnValue(true);
    patchMock.mockRejectedValue(new Error('Report name already exists'));
    renderVersionInfo();
    openModal();
    await screen.findByText('Rename report');

    fireEvent.change(getNameInput(), { target: { value: 'Taken name' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(screen.getByText('Rename report')).toBeTruthy();
  });
});
