import React from 'react';
import { connect } from 'react-redux';

import { push } from 'connected-react-router';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { viewReferral } from '../store/referral';
import { useEncounter } from '../contexts/Encounter';

const DumbActionDropdown = React.memo(({ onCheckin, onCancel, closedDate }) => {
  const { setEncounterId, encounter } = useEncounter();
  const actions = [
    {
      label: 'Admit',
      condition: () => !closedDate,
      onClick: onCheckin,
    },
    {
      label: 'Cancel',
      condition: () => !closedDate,
      onClick: onCancel,
    },
    {
      label: 'View encounter',
      condition: () => !!encounter,
      onClick: async () => {
        await setEncounterId(encounter.id);
      },
    },
  ].filter(action => !action.condition || action.condition());

  return <DropdownButton color="primary" actions={actions} />;
});

const ActionDropdown = connect(null, dispatch => ({
  onCheckin: () => dispatch(push('/patients/view/checkin')),
  onCancel: () => console.log('TODO'),
}))(DumbActionDropdown);

const StatusDisplay = React.memo(({ encounter, closedDate }) => {
  if (encounter) {
    return (
      <span>
        <span>Completed (</span>
        <DateDisplay date={closedDate} />
        <span>)</span>
      </span>
    );
  } else if (closedDate) {
    return (
      <span>
        <span>Cancelled (</span>
        <DateDisplay date={closedDate} />
        <span>)</span>
      </span>
    );
  }
  return 'Pending';
});

const getDate = ({ date }) => <DateDisplay date={date} />;
const getDepartment = ({ department }) => (department ? department.name : 'Unknown');
const getDisplayName = ({ referredBy }) => (referredBy || {}).displayName || 'Unknown';
const getStatus = ({ encounter, closedDate }) => (
  <StatusDisplay encounter={encounter} closedDate={closedDate} />
);

const getActions = ({ encounter, closedDate }) => (
  <ActionDropdown encounter={encounter} closedDate={closedDate} />
);

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Department', accessor: getDepartment },
  { key: 'referredBy', title: 'Referring doctor', accessor: getDisplayName },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'actions', title: 'Actions', accessor: getActions },
];

const DumbReferralTable = React.memo(({ patientId, onReferralSelect }) => (
  <DataFetchingTable
    columns={columns}
    endpoint={`patient/${patientId}/referrals`}
    noDataMessage="No referrals found"
    onRowClick={row => onReferralSelect(row)}
  />
));

export const ReferralTable = connect(null, dispatch => ({
  onReferralSelect: referral => dispatch(viewReferral(referral.id)),
}))(DumbReferralTable);
