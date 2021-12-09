import React, { useCallback } from 'react';

import { Modal } from './Modal';

import { FormGrid } from './FormGrid';
import { FormSeparatorLine } from './FormSeparatorLine';
import { FormSectionSeparator } from './FormSectionSeparator';
import { TextField, DateField, CheckField } from './Field';
import { Button } from './Button';
import { useEncounter } from '../contexts/Encounter';

export const ReferralDetailsModal = React.memo(({ open, onClose, referral }) => {
  const { loadEncounter } = useEncounter();
  const {
    referralNumber,
    referredBy = { displayName: 'Unknown' },
    date,
    referredToDepartment = { name: 'Unknown' },
    referredToFacility = { name: 'Unknown' },
    encounterId,
    reasonForReferral,
    urgent,
  } = referral;

  const onViewEncounter = useCallback(() => {
    loadEncounter(encounterId, true);
  }, [loadEncounter, encounterId]);

  return (
    <Modal title="Referral Details" open={open} onClose={onClose}>
      <FormGrid>
        <TextField
          field={{
            name: 'referralNumber',
            value: referralNumber,
          }}
          label="Referral number"
          disabled
          style={{ gridColumn: '1/-1' }}
        />
        <TextField
          field={{ name: 'referredById', value: referredBy.displayName }}
          label="Referring doctor"
          disabled
        />
        <DateField field={{ name: 'date', value: date }} label="Date" disabled />
        <CheckField field={{ name: 'urgent', value: urgent }} label="Urgent priority" disabled />
        <FormSectionSeparator heading="Being referred to:" />
        <TextField
          field={{
            name: 'referredToDepartmentId',
            value: referredToDepartment.name,
          }}
          label="Department"
          disabled
          style={{ gridColumn: '1/-1' }}
        />
        <TextField
          field={{
            name: 'referredToFacilityId',
            value: referredToFacility.name,
          }}
          label="Facility"
          disabled
          style={{ gridColumn: '1/-1' }}
        />
        <FormSeparatorLine />
        <TextField
          field={{
            name: 'reasonForReferral',
            value: reasonForReferral,
          }}
          label="Reason for referral"
          disabled
          style={{ gridColumn: '1/-1' }}
        />
        {encounterId && (
          <Button
            style={{ gridColumn: '2/-1' }}
            color="primary"
            variant="contained"
            onClick={onViewEncounter}
          >
            View encounter
          </Button>
        )}
      </FormGrid>
    </Modal>
  );
});
