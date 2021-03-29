import React, { useState, useCallback, useEffect } from 'react';

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

const StatusDisplay = React.memo(({ completingEncounter }) => {
  if (completingEncounter) return 'Complete';
  return 'Pending';
});

const ReferenceDataDisplay = React.memo(({ id }) => {
  const [name, setName] = useState('Unknown');

  useEffect(() => {
    (async () => {
      const result = await models.ReferenceData.findOne({ where: { id } });
      setName(result.name);
    })();
  }, [id]);

  return name;
});

const getDate = ({ initiatingEncounter }) => <DateDisplay date={initiatingEncounter.startDate} />;
const getDepartment = ({ initiatingEncounter }) => <ReferenceDataDisplay id={initiatingEncounter.departmentId} />;
const getDisplayName = ({ initiatingEncounter }) => (initiatingEncounter.examiner || {}).displayName || 'Unknown';
const getStatus = ({ completingEncounter }) => completingEncounter ? 'Complete' : 'Pending';

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
