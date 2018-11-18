import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { isEmpty, head } from 'lodash';
import ReactTable from 'react-table';
import { admittedPatientsColumns, pageSizes, dbViews } from '../../constants';
import { PatientsCollection } from '../../collections';

import { Button } from '../../components/Button';

class AdmittedPatients extends Component {
  constructor(props) {
    super(props);
    this.state = {
      view: dbViews.patientsAdmitted,
      admittedPatients: [{}],
      loading: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.setActionsColumn = this.setActionsColumn.bind(this);
    this.onFetchData = this.onFetchData.bind(this);
  }

  componentWillMount() {
    admittedPatientsColumns[admittedPatientsColumns.length - 1].Cell = this.setActionsColumn;
  }

  componentDidMount() {
    this.props.collection.on('update', this.handleChange);
    this.onFetchData();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    let { models: admittedPatients } = this.props.collection;
    if (admittedPatients.length > 0) {
      admittedPatients = admittedPatients.map(patient => {
        const { attributes } = patient;
        attributes.location = '';
        if (attributes.admitted) {
          const admission = patient.getCurrentAdmission();
          if (!isEmpty(admission)) attributes.location = admission.get('location');
        }
        return attributes;
      });
    }

    this.setState({ admittedPatients });
  }

  goEditPatient = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goEdit = (patientId) => {
    this.props.history.push(`/patients/editvisit/${patientId}`);
  }

  async onFetchData() {
    const { view } = this.state;
    this.setState({ loading: true });

    try {
      await this.props.collection.fetchByView({ view, page_size: 1000 }).promise();
      this.setState({ loading: false });
    } catch (err) {
      this.setState({ loading: false });
      console.error(err);
    }
  }

  discharge(patientId) {
    let dischargeUrl = '';
    const patient = this.props.collection.where({ _id: patientId })[0];
    if (!isEmpty(patient)) {
      const admission = patient.getCurrentAdmission();
      if (!isEmpty(admission)) dischargeUrl = `/patients/visit/${patientId}/${admission.id}`;
    }
    this.props.history.push(dischargeUrl);
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button 
          variant="outlined"
          onClick={() => this.goEditPatient(row._id)}
        >View Patient</Button>
        <Button 
          variant="contained"
          color="primary"
          onClick={() => this.discharge(row._id)}
        >Discharge</Button>
      </div>
    );
  }

  render() {
    const { admittedPatients } = this.state;
    return (
      <div className="content">
        <div className="view-top-bar">
          <span>
            Admitted Patients
          </span>
          <div className="view-action-buttons">
            <Link to="/patients/edit/new">
              + New Patient
            </Link>
          </div>
        </div>
        <div className="detail">
          {admittedPatients.length === 0 ?
            <div className="notification">
              <span>
                No patients found. <Link to="/patients/edit/new">Create a new patient record?</Link>
              </span>
            </div>
            :
            <div>
              <ReactTable
                keyField="_id"
                data={admittedPatients}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.patients}
                loading={this.state.loading}
                columns={admittedPatientsColumns}
                className="-striped"
                defaultSortDirection="asc"
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

AdmittedPatients.defaultProps = {
  collection: new PatientsCollection(),
};

export default AdmittedPatients;
