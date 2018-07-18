import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, pageSizes, programsPatientsColumns } from '../../constants';
import { PatientsCollection } from '../../collections';
import { ProgramModel } from '../../models';

class Patients extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.setActionsCol = this.setActionsCol.bind(this);
  }

  state = {
    pageSize: pageSizes.patients
  }

  async componentWillMount() {
    this.props.collection.on('update', this.handleChange);
    // this.props.collection.setPageSize(this.state.pageSize);
    // this.props.collection.fetchByView();
    // console.log('__this.props.collection__', this.props.collection);
    this.loadProgram(this.props);
  }

  componentWillReceiveProps(newProps) {
    const { deletePatientSuccess } = newProps;
    this.loadProgram(newProps);

    if (deletePatientSuccess) {
      this.props.collection.fetchByView();
    }
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  async loadProgram(props) {
    const { programId } = props.match.params;
    this.props.programModel.set({ _id: programId });
    await this.props.programModel.fetch();
    const program = this.props.programModel.toJSON();
    this.setState({ program });
  }

  handleChange() {
    this.forceUpdate();
  }

  selectPatient = (patientId) => {
    const { programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  onFetchData = (state) => {
    console.log('__onFetchData__', state.page);
    this.props.collection.setPage(state.page);
    this.props.collection.setPageSize(state.pageSize);

    this.setState({ loading: true });
    this.props.collection.fetchByView({
      success: () => {
        this.setState({ loading: false });
      }
    });
  }

  setActionsCol(row) {
    const _this = this;
    return (
      <div key={row._id}>
        <button className="button is-primary is-outlined column-button" onClick={() => _this.selectPatient(row.value._id)}>Select Patient</button>
      </div>
    );
  }

  render() {
    const { program } = this.state;
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.toJSON());

    // Set actions col for our table
    const lastCol = programsPatientsColumns[programsPatientsColumns.length - 1];
    lastCol.Cell = this.setActionsCol;

    return (
      <div className="content">
        <div className="view-top-bar">
          <span>{program && program.name}</span>
        </div>
        <div className="detail">
          <ReactTable
            manual
            keyField="_id"
            data={patients}
            pages={this.props.collection.totalPages}
            defaultPageSize={this.state.pageSize}
            loading={this.state.loading}
            columns={programsPatientsColumns}
            className="-striped"
            defaultSortDirection="asc"
            onFetchData={this.onFetchData}
            filterable
          />
          {/* {patients.length === 0 ?
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
                data={patients}
                pages={this.props.collection.totalPages}
                defaultPageSize={pageSizes.patients}
                loading={this.state.loading}
                columns={programsPatientsColumns}
                className="-striped"
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
                filterable
              />
            </div>
          } */}
        </div>
      </div>
    );
  }
}

Patients.defaultProps = {
  programModel: new ProgramModel(),
  collection: new PatientsCollection(),
  patients: []
};

export default Patients;
