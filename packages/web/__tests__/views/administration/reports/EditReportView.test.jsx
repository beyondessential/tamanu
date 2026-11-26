import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { SettingsContext } from '@tamanu/ui-components';

import { renderElementWithTranslatedText } from '../../../helpers';
import { EditReportView } from '../../../../app/views/administration/reports/EditReportView';

let reportName = 'Old report name';

const getMock = vi.fn(async url => {
  if (String(url).includes('dbSchemaOptions')) return [];
  return {
    id: 'version-1',
    versionNumber: 3,
    createdAt: '2026-11-01 10:00:00',
    createdBy: { displayName: 'Report Author' },
    query: 'select 1',
    status: 'draft',
    notes: 'Saved notes',
    queryOptions: { dataSources: [], parameters: [] },
    reportDefinition: { id: 'report-1', name: reportName, dbSchema: 'reporting' },
  };
});

const patchMock = vi.fn(async (_route, { name }) => {
  reportName = name;
  return { id: 'report-1', name };
});

vi.mock('../../../../app/api', () => ({
  useApi: () => ({ get: getMock, patch: patchMock, post: vi.fn() }),
}));

vi.mock('../../../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true } }),
}));

vi.mock('react-router', () => ({
  useParams: () => ({ reportId: 'report-1', versionId: 'version-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../../../app/views/administration/reports/components/editing', () => ({
  ParameterItem: () => null,
  ParameterList: () => null,
  SQLQueryEditor: () => null,
}));

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({ formatShortestDateTime: value => value }),
  JSONEditor: () => null,
}));

const renderEditReportView = () =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <EditReportView />
    </SettingsContext.Provider>,
  );

const getNotesInput = () =>
  Array.from(document.querySelectorAll('textarea')).find(
    element => !element.getAttribute('aria-hidden'),
  );

const renameTo = async newName => {
  fireEvent.click(screen.getByTestId('iconbutton-rename-report'));
  await screen.findByText('Rename report');
  const nameInput = screen.getAllByDisplayValue('Old report name').find(input => !input.disabled);
  fireEvent.change(nameInput, { target: { value: newName } });
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() => expect(patchMock).toHaveBeenCalled());
};

describe('Renaming from the report edit screen', () => {
  afterEach(() => {
    reportName = 'Old report name';
    vi.clearAllMocks();
  });

  it('keeps unsaved editor changes when a report is renamed', async () => {
    renderEditReportView();
    await screen.findByText('Old report name');
    await waitFor(() => expect(getNotesInput()?.value).toBe('Saved notes'));

    fireEvent.change(getNotesInput(), { target: { value: 'Unsaved notes' } });

    await renameTo('New report name');
    await waitFor(() => expect(screen.getAllByText('New report name').length).toBeGreaterThan(0));

    expect(getNotesInput().value).toBe('Unsaved notes');
  });

  it('shows the new name in the info card and the read-only name field', async () => {
    renderEditReportView();
    await screen.findByText('Old report name');

    await renameTo('New report name');

    await waitFor(() => expect(screen.getAllByText('New report name').length).toBeGreaterThan(0));
    await waitFor(() => {
      const nameField = screen
        .getAllByDisplayValue('New report name')
        .find(input => input.disabled);
      expect(nameField).toBeTruthy();
    });
  });
});
