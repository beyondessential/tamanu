import React from 'react';
import { connect } from 'react-redux';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

import { viewReferral } from '../store/referral';

const StatusDisplay = React.memo(({ visit, closedDate }) => {
  const dateDisplay = <DateDisplay date={closedDate} />;
  if(visit) {
    return <span>Completed ({dateDisplay})</span>;
  } else if(closedDate) {
    return <span>Cancelled ({dateDisplay})</span>;
  } else {
    return 'Pending';
  }
});

const getDate = ({ date }) => <DateDisplay date={date} />;
const getDepartment = ({ location }) => (location ? location.name : 'Unknown');
const getFacility = ({ facility }) => (facility ? facility.name : 'Unknown');
const getDisplayName = ({ referringDoctor }) => (referringDoctor || {}).displayName || 'Unknown';
const getStatus = ({ visit, closedDate }) => (
  <StatusDisplay visit={visit} closedDate={closedDate} />
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
