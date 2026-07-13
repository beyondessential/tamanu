/*
 * Regression test for encounter pane read-only gating.
 *
 * EncounterView/PatientView compute a read-only flag (discharged encounter or
 * deceased patient) and pass it to each pane as `disabled`. The panes previously
 * destructured a prop named `readonly`, which was never supplied, so their action
 * buttons stayed enabled. The fix renames the prop to `disabled` so the buttons
 * disable as intended.
 *
 * ImagingPane is the simplest affected pane: its "Print" action is a plain button
 * with no permission machinery. We stub the heavy table/modals (and the permission
 * button, which needs an auth context) so we can render just the action row.
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../../helpers';

// The permission button needs an auth context; stub it to a plain button that forwards `disabled`.
vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    ButtonWithPermissionCheck: ({ children, disabled, ['data-testid']: dataTestId }) => (
      <button type="button" disabled={disabled} data-testid={dataTestId}>
        {children}
      </button>
    ),
  };
});

// Stub the data-fetching table and modals so the pane renders without a backend.
vi.mock('../../../../app/components/ImagingRequestModal', () => ({
  ImagingRequestModal: () => null,
}));
vi.mock('../../../../app/components/ImagingRequestsTable', () => ({
  ImagingRequestsTable: () => null,
}));
vi.mock('../../../../app/components/PatientPrinting', () => ({
  PrintMultipleImagingRequestsSelectionModal: () => null,
}));

import { ImagingPane } from '../../../../app/views/patients/panes/ImagingPane';

const PRINT_BUTTON = 'button-21bg';
const NEW_REQUEST_BUTTON = 'buttonwithpermissioncheck-14hy';

const renderPane = disabled =>
  renderElementWithTranslatedText(<ImagingPane encounter={{ id: 'encounter-1' }} disabled={disabled} />);

describe('ImagingPane read-only gating', () => {
  it('disables the action buttons when disabled is true', () => {
    renderPane(true);

    expect(screen.getByTestId(PRINT_BUTTON).disabled).toBe(true);
    expect(screen.getByTestId(NEW_REQUEST_BUTTON).disabled).toBe(true);
  });

  it('leaves the action buttons enabled when disabled is false', () => {
    renderPane(false);

    expect(screen.getByTestId(PRINT_BUTTON).disabled).toBe(false);
    expect(screen.getByTestId(NEW_REQUEST_BUTTON).disabled).toBe(false);
  });
});
