import React,{ Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Typography, Grid } from '@material-ui/core';
import { Button } from '../../../components';
import {
  patientsLabRequestsColumns, LAB_REQUEST_STATUSES,
  columnStyle, headerStyle, dateFormat, pageSizes,
} from '../../../constants';

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

const TestType = ({ name, category, range }) => (
  <Grid container direction="column">
    <Typography variant="subtitle1">{name}</Typography>
    <Typography variant="caption">{range.join(' - ')}</Typography>
    <Typography variant="caption">{category.name}</Typography>
  </Grid>
);

const TestResult = ({ range, result, unit }) => {
  if (range && Array.isArray(range) && result) {
    try {
      const resultParsed = parseFloat(result);
      if (resultParsed < range[0] || resultParsed > range[1]) {
        return (
          <span style={{ fontWeight: 'bold' }}>
            {`${result} ${unit || ''}`}
          </span>
        );
      }
    } catch (err) {
      console.error(err);
    }
  }
  return `${result} ${unit || ''}`;
}

const getTestsFromLabRequests = (labRequests, sex) => {
  let labTestsById = {};
  labRequests.forEach(labRequestModel => {
    const { _id: requestId, tests, requestedDate } = labRequestModel.toJSON();
    const accessorPrefix = moment(requestedDate).unix();
    tests.forEach(({ _id, type, result, ...attributes }) => {
      const testRange = type[`${sex}Range`];
      const testObject = {
        ...attributes,
        date: requestedDate,
        requestId,
        testType: <TestType range={testRange} {...type} />,
        [`${accessorPrefix}-result`]: <TestResult range={testRange} result={result} {...type} />,
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
      Header: moment(date).format(dateFormat),
      accessor: `${accessorPrefix}-result`,
      headerStyle,
      style: columnStyle,
    });
  });
  columns.push(getActionsColumn());
  return columns;
}

class Labs extends Component {
  state = {
    columns: [],
    labTests: [],
  }

  componentWillMount() {
    const { patientModel } = this.props;
    this.labRequests = patientModel.getLabRequests();
    this.labRequests.on('pageable:state:change', this.handleChange);
    this.labRequests.setPageSize(pageSizes.patientLabRequests);
  }

  handleChange = () => {
    const { patientModel } = this.props;
    const labTests = getTestsFromLabRequests(this.labRequests.models, patientModel.get('sex'));
    const columns = generateDataColumns(labTests);
    this.setState({ labTests, columns });
  }

  prevPage = () => {
    this.labRequests.getPreviousPage();
  }

  nextPage = () => {
    this.labRequests.getNextPage();
  }

  render() {
    const { labTests, columns } = this.state;
    const labRequestsState = this.labRequests.state;

    return (
      <React.Fragment>
        { labTests.length > 0 ?
          <React.Fragment>
            <Grid container item justify="flex-end">
              <Button
                disabled={labRequestsState.currentPage <= 0}
                onClick={this.prevPage}
              >Prev</Button>
              <Button
                disabled={labRequestsState.currentPage === (labRequestsState.totalPages - 1)}
                onClick={this.nextPage}
              >Next</Button>
            </Grid>
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
            </Grid>
          </React.Fragment>:
          <div className="notification">
            <span>
              No requests found.
            </span>
          </div>
        }
      </React.Fragment>
    );
  }
}

export default Labs;