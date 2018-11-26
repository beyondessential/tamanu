import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, head } from 'lodash';
import ReactTable from 'react-table';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, pageSizes, programsPatientsColumns } from '../../constants';
import { PatientsCollection } from '../../collections';
import { ProgramModel } from '../../models';
import { PatientSearchBar } from '../../components';
import { Button } from '../../components/Button';

class Patients extends Component {
  constructor(props) {
    super(props);
    this.onFetchData = this.onFetchData.bind(this);
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
    this.loadProgram(this.props);
  }

  componentWillReceiveProps(newProps) {
    this.loadProgram(newProps);
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

  onFetchData = async (state = {}) => {
    console.log('-onFetchData-', state);
    const { keyword, program } = this.state;
    console.log('-program-', program);
    const { filterView: view } = program;
    this.setState({ loading: true });


    try {
      // Reset keyword
      this.props.collection.setKeyword('');
      // Set pagination options
      const sort = head(state.sorted);
      if (state.sorted.length > 0) this.props.collection.setSorting(sort.id, sort.desc ? 1 : -1);
      if (keyword) this.props.collection.setKeyword(keyword);
      this.props.collection.setPageSize(state.pageSize);
      await this.props.collection.getPage(state.page, view);
      this.setState({ loading: false });
    } catch (err) {
      this.setState({ loading: false });
      console.error(err);
    }
  }

  setActionsCol(row) {
    const _this = this;
    return (
      <div key={row._id}>
        <Button 
          variant="contained"
          color="primary"
          onClick={() => _this.selectPatient(row.value._id)}
        >Select Patient</Button>
      </div>
    );
  }

  searchSubmit(keyword) {
    const { tableState } = this.state;
    this.setState({ keyword }, () => {
      this.onFetchData(tableState);
    });
  }

  searchReset() {
    const { tableState } = this.state;
    this.setState({ keyword: '' }, () => {
      this.onFetchData(tableState);
    });
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
