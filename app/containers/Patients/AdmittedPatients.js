import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';
import { patientColumns, pageSizes } from '../../constants';
import { PatientsCollection } from '../../collections';

class AdmittedPatients extends Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
    this.handleChange = this.handleChange.bind(this);
    this.setActionsColumn = this.setActionsColumn.bind(this);
    this.onFetchData = this.onFetchData.bind(this);
  }

  componentDidMount() {
    patientColumns[patientColumns.length - 1].Cell = this.setActionsColumn;
    this.props.collection.on('update', this.handleChange);
    this.props.collection.fetch({ options: { query: { fun: 'patient_by_admission' } } });
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  goEditPatient = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goEdit = (patientId) => {
    this.props.history.push(`/patients/editvisit/${patientId}`);
  }

  onFetchData = (state) => {
    this.props.collection.setPage(state.page);
    this.props.collection.setPageSize(state.pageSize);

    this.setState({ loading: true });
    this.props.collection.fetchByView({
      view: 'patient_by_admission',
      success: () => {
        this.setState({ loading: false });
      }
    });
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <button className="button column-button" onClick={() => this.goEditPatient(row._id)}>Edit</button>
        <button className="button is-primary column-checkin-button" onClick={() => this.goEdit(row._id)}>{row.admitted ? 'Discharge' : 'Admit'}</button>
        <button className="button is-danger column-button">Delete</button>
      </div>
    );
  }

  render() {
    let { models: admittedPatients } = this.props.collection;
    if (!isEmpty(admittedPatients)) admittedPatients = map(admittedPatients, patient => patient.attributes);
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
                manual
                keyField="_id"
                data={admittedPatients}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.patients}
                loading={this.state.loading}
                columns={patientColumns}
                className="-striped"
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
              />
            </div>
          }
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { admittedPatients } = state.patients;
  return {
    admittedPatients
  };
}

const mapDispatchToProps = () => ({
  collection: new PatientsCollection()
});

export default connect(mapStateToProps, mapDispatchToProps)(AdmittedPatients);
