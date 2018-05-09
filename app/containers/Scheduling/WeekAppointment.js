import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import BootstrapTable from 'react-bootstrap-table-next';
import { fetchMedications } from '../../actions/medications';
import { medicationColumns } from '../../constants';

class WeekAppointment extends Component {
  componentDidMount() {
    this.props.fetchMedications();
  }

  render() {
    const { medications } = this.props;
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Appointments This Week
          </span>
          <div className="view-action-buttons">
            <Link to="/appointments/edit/new">
              + New Appointment
            </Link>
          </div>
        </div>
        <div className="detail">
          <BootstrapTable
            keyField="id"
            data={medications}
            columns={medicationColumns}
            defaultSortDirection="asc"
          />
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

export default connect(mapStateToProps, mapDispatchToProps)(WeekAppointment);
