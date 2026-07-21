import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';
import { AddUserModal } from '../../../app/views/administration/users/profiles/AddUserModal';

// Regression test for the submit-in-flight state in
// packages/web/app/views/administration/users/profiles/AddUserModal.jsx.
//
// web pins @tanstack/react-query v4, whose mutations expose `isLoading` (v5 uses
// `isPending`). The modal previously destructured `isPending` from useMutation,
// which was always undefined, so `isPending` (the combined flag) was never true:
// the Confirm button was never disabled while saving, allowing a double-click to
// fire two createUser POSTs and create duplicate users. The fix reads `isLoading`.
//
// The mutation hooks are mocked with the react-query v4 shape (isLoading, and NO
// isPending key) so a pre-fix build reading `.isPending` still sees undefined and
// leaves the buttons enabled — making this test fail without the fix.

const { mockCreateUser, mockValidateUser } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockValidateUser: vi.fn(),
}));

vi.mock('../../../app/api/mutations', () => ({
  useCreateUserMutation: () => mockCreateUser(),
  useValidateUserMutation: () => mockValidateUser(),
}));

// Avoid needing the ApiContext just to build suggesters.
vi.mock('../../../app/api', async importOriginal => ({
  ...(await importOriginal()),
  useSuggester: () => ({}),
}));

// Strip the heavy field layer; we only care about the Confirm/Cancel buttons.
vi.mock('../../../app/components/Field', async importOriginal => ({
  ...(await importOriginal()),
  Field: () => null,
  AutocompleteField: () => null,
  MultiAutocompleteField: () => null,
  TextField: () => null,
}));

// Replace the Formik Form with a passthrough that invokes the render prop, and
// FormGrid with a plain wrapper, keeping the real Button/OutlinedButton so their
// disabled behaviour is exercised for real.
vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    Form: ({ render }) => <>{render({ submitForm: () => {} })}</>,
    FormGrid: ({ children }) => <div>{children}</div>,
  };
});

const renderModal = () =>
  renderElementWithTranslatedText(
    <AddUserModal open onClose={() => {}} handleRefresh={() => {}} />,
  );

describe('AddUserModal submit-in-flight state', () => {
  beforeEach(() => {
    // react-query v4 mutation shape: isLoading present, isPending absent.
    mockCreateUser.mockReturnValue({ mutate: vi.fn(), isLoading: false });
    mockValidateUser.mockReturnValue({ mutateAsync: vi.fn(), isLoading: false });
  });

  it('disables Confirm and Cancel while the create mutation is loading', () => {
    mockCreateUser.mockReturnValue({ mutate: vi.fn(), isLoading: true });

    renderModal();

    // Confirm switches to its functionally-disabled variant with a spinner.
    const confirmButton = screen.getByTestId('button-0nnt');
    expect(confirmButton.disabled).toBe(true);
    expect(screen.getByTestId('styledcircularprogress-4end')).toBeTruthy();

    // Cancel is disabled while a save is in flight.
    const cancelButton = screen.getByText('Cancel').closest('button');
    expect(cancelButton.disabled).toBe(true);
  });

  it('keeps Confirm and Cancel enabled when no mutation is in flight', () => {
    renderModal();

    const confirmButton = screen.getByText('Confirm').closest('button');
    expect(confirmButton.disabled).toBe(false);
    expect(screen.queryByTestId('styledcircularprogress-4end')).toBeNull();

    const cancelButton = screen.getByText('Cancel').closest('button');
    expect(cancelButton.disabled).toBe(false);
  });
});
