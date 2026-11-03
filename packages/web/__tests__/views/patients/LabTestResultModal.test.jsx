/*
 * The result details modal shows a change log only when a result has actually been edited. The
 * history endpoint emits one entry per distinct value a field has taken (including its first fill),
 * so a never-edited test that has both a result and a secondary result yields two entries — which
 * must NOT be mistaken for an edit (TAM-3101).
 */

import * as React from 'react';
import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { renderElementWithTranslatedText } from '../../helpers';

const { historyRef } = vi.hoisted(() => ({ historyRef: { current: [] } }));

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
  useLabTestResultHistoryQuery: () => ({ data: historyRef.current }),
}));

vi.mock('../../../app/contexts/LabRequest', () => ({
  useLabRequest: () => ({ loadLabRequest: vi.fn() }),
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
  it('hides the change log when a result and a secondary result were each only filled once', () => {
    historyRef.current = [
      { id: '1-result', fieldType: 'result', result: 'Positive', loggedAt: '2026-01-01 00:00:00' },
      { id: '1-secondaryResult', fieldType: 'secondaryResult', result: 'A', loggedAt: '2026-01-01 00:00:00' },
    ];
    renderModal();
    expect(screen.queryByText('History')).toBeNull();
  });

  it('shows the change log when a field has taken more than one value', () => {
    historyRef.current = [
      { id: '2-result', fieldType: 'result', result: 'Negative', loggedAt: '2026-01-02 00:00:00' },
      { id: '1-result', fieldType: 'result', result: 'Positive', loggedAt: '2026-01-01 00:00:00' },
    ];
    renderModal();
    expect(screen.queryByText('History')).not.toBeNull();
  });
});
