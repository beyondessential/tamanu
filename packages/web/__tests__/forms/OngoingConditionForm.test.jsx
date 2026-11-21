import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { SettingsContext } from '@tamanu/ui-components';
import { renderElementWithTranslatedText } from '../helpers';
import { OngoingConditionForm } from '../../app/forms/OngoingConditionForm';

vi.mock('../../app/components/Field', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    AutocompleteField: ({ field, ['data-testid']: testId }) => (
      <button
        type="button"
        data-testid={testId}
        onClick={() => field.onChange({ target: { name: field.name, value: 'diag-asthma' } })}
      >
        select
      </button>
    ),
    DateField: ({ field, ['data-testid']: testId }) => (
      <input
        data-testid={testId}
        name={field.name}
        value={field.value ?? ''}
        onChange={field.onChange}
      />
    ),
  };
});

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({ getCurrentDate: () => '2026-07-13' }),
  };
});

vi.mock('../../app/api', () => ({ useApi: () => ({}) }));

vi.mock('../../app/contexts/NoteModal', () => ({
  useNoteModal: () => ({ isNoteModalOpen: false }),
}));

const renderAddForm = onSubmit =>
  renderElementWithTranslatedText(
    <SettingsContext.Provider value={{ getSetting: () => undefined }}>
      <OngoingConditionForm onSubmit={onSubmit} onCancel={() => {}} />
    </SettingsContext.Provider>,
  );

const chooseConditionAndTickResolved = () => {
  fireEvent.click(screen.getByTestId('field-j30y'));
  fireEvent.click(screen.getByRole('checkbox'));
};

const save = () => fireEvent.click(screen.getByTestId('formsubmitcancelrow-2r80-confirmButton'));

describe('OngoingConditionForm, adding a condition', () => {
  it('saves a condition already resolved, with the resolution date prefilled to today', async () => {
    const onSubmit = vi.fn();
    renderAddForm(onSubmit);

    chooseConditionAndTickResolved();
    save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      conditionId: 'diag-asthma',
      recordedDate: '2026-07-13',
      resolved: true,
      resolutionDate: '2026-07-13',
    });
  });

  it('leaves the resolution out when Resolved is not ticked', async () => {
    const onSubmit = vi.fn();
    renderAddForm(onSubmit);

    fireEvent.click(screen.getByTestId('field-j30y'));
    save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('resolutionDate');
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('resolved');
  });
});
