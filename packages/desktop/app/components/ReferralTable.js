import React, { useState, useCallback } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { useReferral } from '../contexts/Referral';
import { ReferralDetailsModal } from './ReferralDetailsModal';

const ActionDropdown = React.memo(({ row }) => {
  const [open, setOpen] = useState(false);
  const { loadEncounter } = useEncounter();
  const { writeReferral } = useReferral();
  const onViewEncounter = useCallback(async () => {
    loadEncounter(row.encounterId, true);
  }, [row]);
  const onCancelReferral = useCallback(async () => {
    await writeReferral(row.id, { cancelled: true });
  }, [row]);

  const actions = [
    {
      label: 'Admit',
      condition: () => !row.encounterId && !row.cancelled,
      onClick: () => setOpen(true),
    },
    {
      label: 'View',
      condition: () => !!row.encounterId,
      onClick: onViewEncounter,
    },
    {
      label: 'Cancel referral',
      condition: () => !row.encounterId && !row.cancelled,
      onClick: onCancelReferral,
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <>
      <DropdownButton color="primary" actions={actions} />
      <EncounterModal
        open={open}
        onClose={() => setOpen(false)}
        patientId={row.patientId}
        referral={row}
      />
    </>
  );
});

const StatusDisplay = React.memo(({ encounterId, cancelled }) => {
  if (encounterId) return 'Complete';
  if (cancelled) return 'Cancelled';
  return 'Pending';
});

const getDate = ({ date }) => <DateDisplay date={date} />;
const getDepartment = ({ referredToDepartment }) =>
  referredToDepartment ? referredToDepartment.name : 'Unknown';
const getDisplayName = ({ referredBy }) => (referredBy || {}).displayName || 'Unknown';
const getStatus = ({ encounterId, cancelled }) => (
  <StatusDisplay encounterId={encounterId} cancelled={cancelled} />
);

const getActions = row => (
  <ActionDropdown row={row} />
);

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Department', accessor: getDepartment },
  { key: 'referredBy', title: 'Referring doctor', accessor: getDisplayName },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'actions', title: 'Actions', accessor: getActions, dontCallRowInput: true },
];

export const ReferralTable = React.memo(({ patientId }) => {
  const [open, setOpen] = useState(false);
  const [referral, setReferral] = useState({});
  const handleRowClick = useCallback(row => {
    setReferral(row);
    setOpen(true);
  }, []);

  return (
    <>
      <DataFetchingTable
        columns={columns}
        endpoint={`patient/${patientId}/referrals`}
        noDataMessage="No referrals found"
        onRowClick={handleRowClick}
      />
      <ReferralDetailsModal open={open} onClose={() => setOpen(false)} referral={referral} />
    </>
  );
});
