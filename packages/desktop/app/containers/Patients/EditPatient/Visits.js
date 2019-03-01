import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { capitalize } from 'lodash';
import { visitsColumns, dateFormat } from '../../../constants';
import { NewButton, EditButton } from '../../../components';

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
    const visits = patient.visits.map(visit => {
      let { startDate, endDate, visitType } = visit;
      if (startDate) startDate = moment(startDate).format(`${dateFormat}`);
      if (endDate) endDate = moment(endDate).format(`${dateFormat}`);
      visitType = capitalize(visitType);
      return  { ...visit, startDate, endDate, visitType } ;
    });
    // Add actions column for our table
    tableColumns[tableColumns.length - 1].Cell = this.setActionsCol;
    this.setState({ visits, tableColumns });
  }

  setActionsCol = (row) => {
    const { patientModel } = this.props;
    return (
      <div key={row.original._id}>
        <EditButton
          to={`/patients/visit/${patientModel.id}/${row.original._id}`}
          size="small"
          can={{ do: 'update', on: 'visit' }} 
        />
      </div>
    );
  }

  render() {
    const { patientModel } = this.props;
    const { visits, tableColumns } = this.state;
    return (
      <div className="column">
        <div className="column p-t-0 p-b-0">
          <NewButton
            className="is-pulled-right"
            to={`/patients/visit/${patientModel.id}`}
            can={{ do: 'create', on: 'visit' }}
          >New Visit</NewButton>
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
