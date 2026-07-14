import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { REFERENCE_TYPES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../helpers';
import { TaskForm } from '../../app/forms/TaskForm';

// Regression test for the stale-frequency bug in packages/web/app/forms/TaskForm.jsx
// handleTaskChange (logic-bug audit, finding W17, PR #10266).
//
// Selecting a task template that has a frequency, then switching to a template
// with no frequency, previously left the old frequencyValue in place (only
// frequencyUnit was cleared), because handleTaskChange only ever set
// frequencyValue when the new template had one and never cleared it otherwise.
// The fix explicitly clears frequencyValue when the selected template has none.

const { nextAutocompleteTargetRef } = vi.hoisted(() => ({
  nextAutocompleteTargetRef: { current: null },
}));

vi.mock('../../app/components/Field', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Stub out the autocomplete so we can trigger `onChange` with a synthetic
    // task-template selection without driving the real react-autosuggest widget.
    AutocompleteField: ({ onChange, field, ['data-testid']: testId }) => (
      <button
        type="button"
        data-testid={testId}
        onClick={() => onChange({ target: { ...nextAutocompleteTargetRef.current, name: field.name } })}
      >
        select
      </button>
    ),
    CheckField: ({ field }) => <input type="checkbox" checked={Boolean(field?.value)} readOnly />,
    DateTimeField: ({ field }) => <input value={field?.value ?? ''} readOnly />,
    SuggesterSelectField: () => null,
    NumberField: ({ field, ['data-testid']: testId }) => (
      <input data-testid={`${testId}-input`} value={field?.value ?? ''} readOnly />
    ),
  };
});

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDateTime: () => ({
      getCurrentDateTime: () => '2026-07-13 00:00:00',
    }),
    TranslatedSelectField: ({ field }) => <div>{field?.value ?? ''}</div>,
    TextField: ({ field }) => <textarea value={field?.value ?? ''} readOnly />,
  };
});

vi.mock('../../app/api', () => ({
  useSuggester: () => ({}),
}));

vi.mock('../../app/api/mutations/useTaskMutation', () => ({
  useCreateTasks: () => ({ mutate: vi.fn(), isLoading: false }),
}));

vi.mock('../../app/contexts/Encounter', () => ({
  useEncounter: () => ({ encounter: { id: 'encounter-1' } }),
}));

vi.mock('../../app/contexts/Auth', () => ({
  useAuth: () => ({ ability: { can: () => true }, currentUser: { id: 'user-1' } }),
}));

const frequencyTaskTemplate = {
  type: REFERENCE_TYPES.TASK_TEMPLATE,
  label: 'Repeating task',
  value: 'task-template-frequency',
  taskTemplate: {
    designations: [],
    highPriority: false,
    frequencyValue: 2,
    frequencyUnit: 'day',
  },
};

const onceOffTaskTemplate = {
  type: REFERENCE_TYPES.TASK_TEMPLATE,
  label: 'Once-off task',
  value: 'task-template-once-off',
  taskTemplate: {
    designations: [],
    highPriority: false,
  },
};

const renderTaskForm = () =>
  renderElementWithTranslatedText(
    <TaskForm onClose={() => {}} refreshTaskTable={() => {}} />,
  );

describe('TaskForm handleTaskChange', () => {
  beforeEach(() => {
    nextAutocompleteTargetRef.current = null;
  });

  it('clears a stale frequency value when switching to a once-off template', () => {
    renderTaskForm();

    nextAutocompleteTargetRef.current = frequencyTaskTemplate;
    fireEvent.click(screen.getByTestId('field-hp09'));

    expect(screen.getByTestId('field-7vdy-input').value).toBe('2');

    nextAutocompleteTargetRef.current = onceOffTaskTemplate;
    fireEvent.click(screen.getByTestId('field-hp09'));

    expect(screen.getByTestId('field-7vdy-input').value).toBe('');
  });
});
