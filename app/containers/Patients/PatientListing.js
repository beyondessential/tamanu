import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty } from 'lodash';
import ReactTable from 'react-table';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { PatientSearchBar } from '../../components';
import { Colors, pageSizes, patientColumns } from '../../constants';
import DeletePatientModal from './components/DeletePatientModal';
import { PatientsCollection } from '../../collections';

class PatientListing extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.setActionsColumn = this.setActionsColumn.bind(this);
    this.onFetchData = this.onFetchData.bind(this);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.searchReset = this.searchReset.bind(this);
  }

  state = {
    deleteModalVisible: false,
    selectedPatient: null,
    pageSize: pageSizes.patients,
    keyword: '',
    tableClass: '',
  }

  componentDidMount() {
    patientColumns[patientColumns.length - 1].Cell = this.setActionsColumn;
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetchByView();
  }

  componentWillReceiveProps({ deletePatientSuccess }) {
    if (deletePatientSuccess) {
      this.props.collection.fetchByView();
    }
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    this.forceUpdate();
  }

  goEdit = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goAdmit = (patientId, patient) => {
    if (patient.admitted) {
      this.props.history.push(`/patients/editvisit/${patientId}`);
    } else {
      this.props.history.push(`/patients/checkin/${patientId}`);
    }
  }

  showDeleteModal = (patient) => {
    this.setState({
      deleteModalVisible: true,
      selectedPatient: patient
    });
  }

  onCloseModal = () => {
    this.setState({ deleteModalVisible: false });
  }

  onDeletePatient = () => {
    let { selectedPatient } = this.state;
    selectedPatient = this.props.collection.findWhere({ _id: selectedPatient._id });
    if (!isEmpty(selectedPatient)) {
      selectedPatient.destroy({
        wait: true,
        success: () => this.onCloseModal()
      });
    }
  }

  onFetchData(state = {}) {
    const { keyword } = this.state;
    this.setState({ loading: true });
    if (keyword === '') {
      this.props.collection.setPage(state.page);
      this.props.collection.setPageSize(state.pageSize);
      this.props.collection.fetchByView({
        success: () => {
          this.setState({ loading: false });
        }
      });
    } else {
      this.props.collection.find({
        selector: {
          displayId: {
            $regex: `(?i)${keyword}`
          }
        },
        fields: ['_id', 'displayId', 'firstName', 'lastName'],
        limit: 50,
        success: () => {
          this.setState({ loading: false });
        }
      });
    }
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <button type="button" className="button column-button" onClick={() => this.goEdit(row._id)}>View Patient</button>
        <button type="button" className="button is-primary column-checkin-button" onClick={() => this.goAdmit(row._id, row.admitted)}>{row.admitted ? 'Discharge' : 'Admit'}</button>
        <button type="button" className="button is-danger column-button" onClick={() => this.showDeleteModal(row)}>Delete</button>
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
    const { deleteModalVisible, tableClass } = this.state;
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.attributes);
    return (
      <div className="content">
        <div className="view-top-bar columns is-gapless">
          <span className="column is-6">
            Patient Listing
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
        <div className="detail">
          {patients.length === 0 ?
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
                columns={patientColumns}
                className={`-striped ${tableClass}`}
                defaultSortDirection="asc"
                onFetchData={this.onFetchData}
              />
            </div>
          }
        </div>
        <DeletePatientModal
          isVisible={deleteModalVisible}
          onClose={this.onCloseModal}
          onDelete={this.onDeletePatient}
          little
        />
      </div>
    );
  }
}

PatientListing.defaultProps = {
  collection: new PatientsCollection(),
  patients: []
};

export default PatientListing;
