import React from 'react';
import { connect } from 'react-redux';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

import { viewReferral } from '../store/referral';

const StatusDisplay = React.memo(({ status, closedDate }) => {
  const dateDisplay = <DateDisplay date={closedDate} />;
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'completed':
      // eslint-disable-next-line
      return <span>Completed ({dateDisplay})</span>;
    case 'cancelled':
      // eslint-disable-next-line
      return <span>Cancelled ({dateDisplay})</span>;
    default:
      return 'Unknown';
  }
});

const getDate = ({ date }) => <DateDisplay date={date} />;
const getDepartment = () => 'todo';
const getFacility = () => 'todo';
const getDisplayName = ({ referringDoctor }) => (referringDoctor || {}).displayName || 'Unknown';
const getStatus = ({ status, closedDate }) => (
  <StatusDisplay status={status} closedDate={closedDate} />
);

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Department', accessor: getDepartment },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'referringDoctor', title: 'Referring doctor', accessor: getDisplayName },
  { key: 'status', title: 'Status', accessor: getStatus },
];

const DumbReferralTable = React.memo(({ referrals, onReferralSelect }) => (
  <Table columns={columns} data={referrals} onRowClick={row => onReferralSelect(row)} />
));

export const ReferralTable = connect(
  null,
  dispatch => ({ onReferralSelect: referral => dispatch(viewReferral(referral._id)) }),
)(DumbReferralTable);
