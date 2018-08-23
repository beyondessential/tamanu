import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { capitalize } from 'lodash';
import { visitsColumns, dateFormat } from '../../../constants';

class Visits extends Component {
  state = {
    visits: [],
  };

  componentWillMount() {
    const { model: Model } = this.props;
    const visits = Model.get('visits');
    this.setState({ visits });
  }

  componentWillReceiveProps(newProps) {
    const { model: Model } = newProps;
    const visits = Model.get('visits');
    this.setState({ visits });
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
    let { visits } = this.state;
    visits = visits.models.map(model => {
      const visit = model.attributes;
      if (visit.startDate !== '') visit.startDate = moment(visit.startDate).format(`${dateFormat}`);
      if (visit.endDate !== null) visit.endDate = moment(visit.endDate).format(`${dateFormat}`);
      visit.visitType = capitalize(visit.visitType);
      return visit;
    });
    // Add actions column for our table
    visitsColumns[visitsColumns.length - 1].Cell = this.setActionsCol;
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
                columns={visitsColumns}
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
