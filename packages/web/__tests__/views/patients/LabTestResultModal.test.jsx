/*
 * The result details modal shows a change log only when the result cell has actually been edited.
 * That flag is computed on the server (the same query the results tables use) and returned as
 * `isEdited` alongside the change history, so the modal simply renders the History section when the
 * server says the cell is edited (TAM-3101).
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

const { dataRef } = vi.hoisted(() => ({
  dataRef: { current: { changes: [], isEdited: false } },
}));

vi.mock('@tamanu/ui-components', async () => {
  const actual = await vi.importActual('@tamanu/ui-components');
  return {
    ...actual,
    // Render the modal body inline so we can query it without a portal/theme.
    Modal: ({ children }) => <div>{children}</div>,
  };
});

vi.mock('../../../app/components/DateDisplay', () => ({ DateDisplay: () => null }));

vi.mock('../../../app/api/queries/useLabTestQuery', () => ({
  useLabTestQuery: () => ({
    data: {
      result: 'Positive',
      secondaryResult: 'A',
      labTestType: { name: 'CK', supportsSecondaryResults: true },
      labRequest: { id: 'lr1', displayId: 'LR1' },
    },
  }),
}));

vi.mock('../../../app/api/queries', () => ({
  useLabTestResultHistoryQuery: () => ({ data: dataRef.current }),
}));

vi.mock('react-router', () => ({
  useParams: () => ({ category: 'all' }),
  useNavigate: () => vi.fn(),
}));

import { LabTestResultModal } from '../../../app/views/patients/LabTestResultModal';

const renderModal = () =>
  renderElementWithTranslatedText(
    <LabTestResultModal open labTestId="t1" onClose={() => {}} includeRequestLink={false} />,
  );

describe('LabTestResultModal change log', () => {
  it('hides the change log when the server reports the cell is not edited', () => {
    dataRef.current = {
      isEdited: false,
      changes: [
        { id: '1-result', fieldType: 'result', result: 'Positive', loggedAt: '2026-01-01 00:00:00' },
        { id: '1-secondaryResult', fieldType: 'secondaryResult', result: 'A', loggedAt: '2026-01-01 00:00:00' },
      ],
    };
    renderModal();
    expect(screen.queryByText('History')).toBeNull();
  });

  it('shows the change log when the server reports the cell is edited', () => {
    dataRef.current = {
      isEdited: true,
      changes: [
        { id: '2-result', fieldType: 'result', result: 'Negative', loggedAt: '2026-01-02 00:00:00' },
        { id: '1-result', fieldType: 'result', result: 'Positive', loggedAt: '2026-01-01 00:00:00' },
      ],
    };
    renderModal();
    expect(screen.queryByText('History')).not.toBeNull();
  });
});
