import React from 'react';
import { describe, expect, it } from 'vitest';

import { LastSentCell } from '../../../app/components/Medication/LastSentCell';

/** Every `stringId` in an element tree, so the cell's copy can be asserted without a render. */
const collectStringIds = node => {
  if (Array.isArray(node)) return node.flatMap(collectStringIds);
  if (!node || typeof node !== 'object' || !node.props) return [];
  if (typeof node.type === 'function' && !node.props.stringId) {
    return collectStringIds(node.type(node.props));
  }
  const { stringId, children } = node.props;
  return [...(stringId ? [stringId] : []), ...collectStringIds(children)];
};

const stringIdsFor = props => collectStringIds(<LastSentCell {...props} />);

// The cell is deliberately agnostic about which pharmacy request it is given: the discharge modal
// passes the most recent send, while the encounter and send-to-pharmacy tables pass the request
// awaiting action. It only renders whichever date and dispensed state it receives.
describe('LastSentCell', () => {
  it('shows not applicable when the medication has never been sent to pharmacy', () => {
    expect(stringIdsFor({ sentAt: null })).toContain('general.fallback.notApplicable');
  });

  it('shows an active request when the request has not been dispensed', () => {
    const stringIds = stringIdsFor({ sentAt: '2024-10-22 09:30:00', isDispensed: false });

    expect(stringIds).toContain('medication.pharmacyRequest.status.activeRequest');
    expect(stringIds).not.toContain('medication.pharmacyRequest.status.dispensed');
  });

  it('shows dispensed when the request has been dispensed', () => {
    const stringIds = stringIdsFor({ sentAt: '2024-10-22 09:30:00', isDispensed: true });

    expect(stringIds).toContain('medication.pharmacyRequest.status.dispensed');
    expect(stringIds).not.toContain('medication.pharmacyRequest.status.activeRequest');
  });
});
