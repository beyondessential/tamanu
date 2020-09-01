import React from 'react';
import { connect } from 'react-redux';

// import { push } from 'connected-react-router';
import { DataFetchingTable, DateDisplay } from '../../components';

// import { viewReferral } from '../store/referral';
// import { viewEncounter } from '../store/encounter';

const getSchedule = ({ schedule }) => (schedule ? schedule.name : 'Unknown');
const getVaccine = ({ vaccine }) => (vaccine ? vaccine.name : 'Unknown');
const getDate = ({ date }) => <DateDisplay date={date} />;
const getAdminsterer = ({ administerer }) => (administerer ? administerer.name : 'Unknown');
const getFacility = ({ facility }) => (facility ? facility.name : 'Unknown');
const getBatch = ({ batch }) => (batch ? batch.name : 'Unknown');
const getTimeliness = ({ date, age, schedule }) => 'On time'; // TODO: calculate timeliness (On time / Late / Blank not given)

const columns = [
  { key: 'schedule', title: 'Schedule', accessor: getSchedule },
  { key: 'vaccine', title: 'Vaccine', accessor: getVaccine },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'adminsterer', title: 'Given by', accessor: getAdminsterer },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'batch', title: 'Batch', accessor: getBatch },
  { key: 'timeliness', title: 'On time', accessor: getTimeliness },
];

const DumbImmunisationRegisterTable = React.memo(() => (
  <DataFetchingTable
    columns={columns}
    endpoint="immunisations"
    noDataMessage="No immunisation data found"
    onRowClick={row => console.log(row)}
  />
));

export const ImmunisationRegisterTable = connect(null, null)(DumbImmunisationRegisterTable);
