import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { capitalize } from 'lodash';
import { visitsColumns, dateFormat } from '../../../constants';

class Visits extends Component {
  state = {
    visits: [],
    tableColumns: visitsColumns
  };

  componentWillMount() {
    this.handleChange();
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { patient } = props;
    const { tableColumns } = this.state;
    let { visits } = patient;
    visits = visits.map(visit => {
      if (visit.startDate !== '') visit.startDate = moment(visit.startDate).format(`${dateFormat}`);
      if (visit.endDate !== null) visit.endDate = moment(visit.endDate).format(`${dateFormat}`);
      visit.visitType = capitalize(visit.visitType);
      return visit;
    });
    // Add actions column for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ visits, tableColumns });
  }

  setActionsCol = (row) => {
    const { model: Model } = this.props;
    return (
      <div key={row.original._id}>
        <Link className="button is-light m-r-5" to={`/patients/visit/${Model.id}/${row.original._id}`}>Edit</Link>
      </div>
    );
  }

  render() {
    const { model: Model } = this.props;
    const { visits, tableColumns } = this.state;
    return (
      <div>
        <div className="column p-t-0 p-b-0">
          <Link className="button is-primary is-pulled-right is-block" to={`/patients/visit/${Model.id}`}>
            <i className="fa fa-plus" /> New Visit
          </Link>
          <div className="is-clearfix" />
        </div>
        <div className="column">
          {visits.length > 0 &&
            <div>
              <ReactTable
                keyField="_id"
                data={visits}
                pageSize={visits.length}
                columns={tableColumns}
                className="-striped"
                defaultSortDirection="asc"
                showPagination={false}
              />
            </div>
          }
          {visits.length === 0 &&
            <div className="notification">
              <span>
                No visits found.
              </span>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default Visits;
