import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import ReactTable from 'react-table';
import actions from '../../actions/medication';
import { medicationColumns, pageSizes, medicationStatuses } from '../../constants';

class Requests extends Component {
  constructor(props) {
    super(props);
    this.fetchData = this.fetchData.bind(this);
  }

  state = {
    medications: [{}],
    totalPages: 0,
    loading: true,
  }

  componentWillMount() {
    medicationColumns[medicationColumns.length - 1].Cell = this.setActionsColumn;
    // this.props.fetchMedications({ page: 0 });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  handleChange(props = this.props) {
    const { medications, loading } = props;
    if (!loading) this.setState({ medications, loading });
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <button type="button" className="button is-primary" disabled>Fullfill</button>
      </div>
    );
  }

  fetchData = opts => {
    this.props.fetchMedications({
      status: medicationStatuses.REQUESTED,
      ...opts
    });
  }

  render() {
    const { medications, totalPages } = this.state;
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Medication Requests
            </span>
            <div className="view-action-buttons">
              <Link to="/medication/request">
                + New Request
              </Link>
              <Link to="/medication/edit/dispense">
                Dispense Medication
              </Link>
              <Link to="/medication/return/new">
                Return Medication
              </Link>
            </div>
          </div>
          <div className="detail">
            {medications.length === 0 ?
              <div className="notification">
                <span>
                  No medications found. <Link to="/medication/request">Create a new medication record?</Link>
                </span>
              </div>
              :
              <div>
                <ReactTable
                  manual
                  keyField="_id"
                  data={medications}
                  pages={totalPages}
                  defaultPageSize={pageSizes.medications}
                  loading={this.state.loading}
                  columns={medicationColumns}
                  className="-striped"
                  defaultSortDirection="asc"
                  onFetchData={this.fetchData}
                />
              </div>
            }
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { medications, totalPages, loading, error } = state.medication;
  return { medications, totalPages, loading, error };
}

const { requests: requestsActions } = actions;
const { fetchMedications } = requestsActions;
const mapDispatchToProps = dispatch => ({
  fetchMedications: (props) => dispatch(fetchMedications(props)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Requests);
