import React from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Typography, Grid } from '@material-ui/core';
import { Button } from '../../../components';
import {
  patientsLabRequestsColumns, LAB_REQUEST_STATUSES,
  columnStyle, headerStyle, dateFormat
} from '../../../constants';

const DEFAULT_NIL_PLACEHOLDER = '-';

const getActionsColumn = () => ({
  id: 'actions',
  Header: 'Actions',
  headerStyle,
  style: columnStyle,
  Cell: (props) => <ActionsColumn {...props} />
});

const ActionsColumn = ({ original: { _id, requestId } }) => (
    <div key={_id}>
      <Button
        variant="contained"
        color="primary"
        size="small"
        to={`/labs/request/${requestId}`}
      >View</Button>
    </div>
)

const TestType = ({ name, category }) => (
  <Grid container direction="column">
    <Typography variant="subtitle1">{name}</Typography>
    <Typography variant="caption">{category.name}</Typography>
  </Grid>
);

const getTestsFromLabRequests = (labRequests, sex) => {
  let labTestsById = {};
  labRequests.forEach(labRequestModel => {
    const { _id: requestId, tests, requestedDate } = labRequestModel.toJSON();
    const accessorPrefix = moment(requestedDate).unix();
    tests.forEach(({ _id, type, result, ...attributes }) => {
      const testObject = {
        ...attributes,
        date: requestedDate,
        requestId,
        testType: <TestType {...type} />,
        [`${accessorPrefix}-range`]: type[`${sex}Range`] || DEFAULT_NIL_PLACEHOLDER,
        [`${accessorPrefix}-result`]: `${result} ${type.unit || ''}`,
      };

      labTestsById[type._id] = { ...labTestsById[type._id] || {}, ...testObject };
    });
  });
  return Object.values(labTestsById);
}

const generateDataColumns = labTests => {
  const allDates = new Set();
  const columns = [];
  labTests.forEach(({ date }) => allDates.add(date));
  allDates.forEach(date => {
    const accessorPrefix = moment(date).unix();
    columns.push({
      id: 'quantity',
      accessor: () => '',
      Header: moment(date).format(dateFormat),
      headerStyle,
      style: columnStyle,
      pivot: true,
      columns: [{
        Header: 'Range',
        accessor: `${accessorPrefix}-range`,
        headerStyle,
        style: columnStyle,
      }, {
        Header: 'Result',
        accessor: `${accessorPrefix}-result`,
        headerStyle,
        style: columnStyle,
      }]
    });
  });
  columns.push(getActionsColumn());
  return columns;
}

const Lab = function ({ patientModel }) {
  const labRequestsCollection = patientModel.getLabRequests();
  const labRequests = labRequestsCollection.where({ status: LAB_REQUEST_STATUSES.PUBLISHED });
  const labTests = getTestsFromLabRequests(labRequests, patientModel.get('sex'));
  const columns = generateDataColumns(labTests);

  return (
    <React.Fragment>
      { labRequests.length > 0 ?
        <Grid container>
          <Grid item xs={1}>
            <ReactTable
              keyField="_id"
              data={labTests}
              pageSize={labTests.length}
              columns={patientsLabRequestsColumns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          </Grid>
          <Grid item xs={11} style={{ overflowX: 'auto' }}>
            <ReactTable
              keyField="_id"
              data={labTests}
              pageSize={labTests.length}
              columns={columns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          </Grid>
        </Grid>:
        <div className="notification">
          <span>
            No requests found.
          </span>
        </div>
      }
    </React.Fragment>
  );
}

export default Lab;