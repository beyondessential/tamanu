import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchMedications } from '../../actions/medications';
import { medicationColumns } from '../../constants';

class Completed extends Component {
  componentDidMount() {
    this.props.fetchMedications();
  }

  render() {
    const { medications } = this.props;
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>
              Completed Medication
            </span>
            <div className="view-action-buttons">
              <Link to="/medication/edit/new">
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
                  No medications found. <Link to="/medication/edit/new">Create a new medication record?</Link>
                </span>
              </div>
              :
              <div>
                <BootstrapTable
                  keyField="id"
                  data={medications}
                  columns={medicationColumns}
                  defaultSortDirection="asc"
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
  return {
    medications: state.medications.medications
  };
}

const mapDispatchToProps = dispatch => ({
  fetchMedications: () => dispatch(fetchMedications()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Completed);
