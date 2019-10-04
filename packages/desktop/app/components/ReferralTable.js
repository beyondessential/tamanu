import React from 'react';
import { connect } from 'react-redux';

import { push } from 'connected-react-router';
import { Table } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { viewReferral } from '../store/referral';
import { viewVisit } from '../store/visit';

const DumbActionDropdown = React.memo(({ onCheckin, onCancel, onView, visit, closedDate }) => {
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
      label: 'View visit',
      condition: () => !!visit,
      onClick: onView,
    },
  ].filter(action => !action.condition || action.condition());

  return <DropdownButton color="primary" actions={actions} />;
});

const ActionDropdown = connect(
  null,
  (dispatch, { visit, _id }) => ({
    onCheckin: () => dispatch(push('/patients/view/checkin')),
    onCancel: () => console.log('TODO'),
    onView: () => dispatch(viewVisit(visit._id)),
  }),
)(DumbActionDropdown);

const StatusDisplay = React.memo(({ visit, closedDate }) => {
  if (visit) {
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
const getDepartment = ({ location }) => (location ? location.name : 'Unknown');
const getFacility = ({ facility }) => (facility ? facility.name : 'Unknown');
const getDisplayName = ({ referringDoctor }) => (referringDoctor || {}).displayName || 'Unknown';
const getStatus = ({ visit, closedDate }) => (
  <StatusDisplay visit={visit} closedDate={closedDate} />
);

const getActions = ({ visit, closedDate }) => (
  <ActionDropdown visit={visit} closedDate={closedDate} />
);

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Department', accessor: getDepartment },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'referringDoctor', title: 'Referring doctor', accessor: getDisplayName },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'actions', title: 'Actions', accessor: getActions },
];

const DumbReferralTable = React.memo(({ referrals, onReferralSelect }) => (
  <Table columns={columns} data={referrals} onRowClick={row => onReferralSelect(row)} />
));

export const ReferralTable = connect(
  null,
  dispatch => ({ onReferralSelect: referral => dispatch(viewReferral(referral._id)) }),
)(DumbReferralTable);
