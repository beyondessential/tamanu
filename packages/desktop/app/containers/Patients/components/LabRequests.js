import React,{ Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Typography, Grid } from '@material-ui/core';
import { Button, Notification } from '../../../components';
import { columnStyle, headerStyle, dateFormat, pageSizes } from '../../../constants';

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
  if (!result) return '';
  if (range && Array.isArray(range)) {
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
      const range = type[`${sex}Range`];
      const testObject = {
        ...attributes,
        date: requestedDate,
        requestId,
        testType: { ...type, range },
        [`${accessorPrefix}-result`]: { range, result, unit: type.unit },
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
    const accessor = `${moment(date).unix()}-result`;
    columns.push({
      Header: moment(date).format(dateFormat),
      accessor,
      headerStyle,
      style: columnStyle,
      Cell: ({ original: { [accessor]: props }}) => <TestResult {...props} />
    });
  });
  columns.push(getActionsColumn());
  return columns;
}

const getFixedTableColumns = () => ([{
  accessor: 'testType',
  Header: 'Test',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
  Cell: ({ original: { testType: props }}) => <TestType {...props} />
}]);

export default class LabRequests extends Component {
  state = {
    columns: [],
    labTests: [],
  }

  componentWillMount() {
    const { parentModel } = this.props;
    this.labRequestsCollection = parentModel.getLabRequests();
    this.labRequestsCollection.on('pageable:state:change', this.handleChange);
    this.labRequestsCollection.setPageSize(pageSizes.patientLabRequests);
  }

  handleChange = (...props) => {
    const { patientsSex } = this.props;
    const labTests = getTestsFromLabRequests(this.labRequestsCollection.models, patientsSex);
    const columns = generateDataColumns(labTests);
    this.setState({ labTests, columns });
  }

  prevPage = () => {
    this.labRequestsCollection.getPreviousPage();
  }

  nextPage = () => {
    this.labRequestsCollection.getNextPage();
  }

  render() {
    const { labTests, columns } = this.state;
    if (labTests.length === 0) return <Notification message="No requests found." />
    return (
      <React.Fragment>
        <Grid container item justify="flex-end">
          <Button
            disabled={!this.labRequestsCollection.hasPreviousPage()}
            onClick={this.prevPage}
          >Prev</Button>
          <Button
            disabled={!this.labRequestsCollection.hasNextPage()}
            onClick={this.nextPage}
          >Next</Button>
        </Grid>
        <Grid container>
          <Grid item xs={1}>
            <ReactTable
              keyField="_id"
              data={labTests}
              pageSize={labTests.length}
              columns={getFixedTableColumns()}
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
      </React.Fragment>
    );
  }
}