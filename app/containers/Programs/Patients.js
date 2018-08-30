import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, pageSizes, programsPatientsColumns } from '../../constants';
import { PatientsCollection } from '../../collections';
import { ProgramModel } from '../../models';
import { PatientSearchBar } from '../../components';

class Patients extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.setActionsCol = this.setActionsCol.bind(this);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.searchReset = this.searchReset.bind(this);
  }

  state = {
    pageSize: pageSizes.patients,
    programLoaded: false,
    keyword: '',
    tableClass: ''
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
    this.setState({ program, programLoaded: true });
  }

  handleChange() {
    this.forceUpdate();
  }

  selectPatient = (patientId) => {
    const { programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  onFetchData = (state) => {
    const { keyword } = this.state;
    const { program } = this.state;
    const { filters } = program.moduleOptions;
    this.setState({ loading: true });
    if (keyword === '') {
      this.props.collection.setPage(state.page);
      this.props.collection.setPageSize(state.pageSize);
      this.props.collection.fetchByView({
        view: filters.view || 'patient_by_display_id',
        success: () => {
          this.setState({ loading: false });
        }
      });
    } else {
      const selector = Object.assign({
        displayId: {
          $regex: `(?i)${keyword}`
        }
      }, filters.selector);
      console.log({ selector });
      this.props.collection.find({
        selector,
        fields: ['_id', 'displayId', 'firstName', 'lastName', 'dateOfBirth', 'sex', 'status'],
        limit: 50,
        success: () => {
          this.setState({ loading: false });
        }
      });
    }
  }

  setActionsCol(row) {
    const _this = this;
    return (
      <div key={row._id}>
        <button className="button is-primary is-outlined column-button" onClick={() => _this.selectPatient(row.value._id)}>Select Patient</button>
      </div>
    );
  }

  searchSubmit(keyword) {
    this.setState({
      keyword,
      tableClass: 'search-results'
    }, this.onFetchData);
  }

  searchReset() {
    this.props.collection.totalPages = 1;
    this.setState({
      keyword: '',
      tableClass: ''
    }, () => this.onFetchData({
        page: 0,
        pageSize: pageSizes.patients
      })
    );
  }

  render() {
    const { program, programLoaded, tableClass } = this.state;
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.toJSON());

    // Set actions col for our table
    const lastCol = programsPatientsColumns[programsPatientsColumns.length - 1];
    lastCol.Cell = this.setActionsCol;

    return (
      <div className="content">
        <div className="view-top-bar columns is-gapless">
          <span className="column is-6">
            {program && program.name}
          </span>
          <div className="column is-311">
            <PatientSearchBar
              name="search"
              className="p-t-10 is-pulled-right"
              onSubmit={this.searchSubmit}
              onReset={this.searchReset}
            />
            <div className="view-action-buttons is-pulled-right m-r-10">
              <Link to="/patients/edit/new">
                <i className="fa fa-plus" /> New Patient
              </Link>
            </div>
          </div>
        </div>
        {/* <div className="view-top-bar">
          <span>{program && program.name}</span>
        </div> */}
        <div className="detail">
          {programLoaded &&
            <ReactTable
              manual
              keyField="_id"
              data={patients}
              pages={this.props.collection.totalPages}
              defaultPageSize={this.state.pageSize}
              loading={this.state.loading && programLoaded}
              columns={programsPatientsColumns}
              className={`-striped ${tableClass}`}
              defaultSortDirection="asc"
              onFetchData={this.onFetchData}
            />
          }
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
