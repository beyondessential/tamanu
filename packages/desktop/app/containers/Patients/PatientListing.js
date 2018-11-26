import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty, toUpper, capitalize, head } from 'lodash';
import ReactTable from 'react-table';

import { PatientSearchBar } from '../../components';
import { Colors, pageSizes, patientColumns } from '../../constants';
import { PatientsCollection } from '../../collections';

import { Button } from '../../components/Button';

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
    selectedPatient: null,
    pageSize: pageSizes.patients,
    keyword: '',
    tableClass: '',
    tableState: {}
  }

  componentDidMount() {
    patientColumns[patientColumns.length - 1].Cell = this.setActionsColumn;
    this.props.collection.on('update', this.handleChange);
    this.props.collection.setPageSize(this.state.pageSize);
    this.props.collection.fetch();
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange);
  }

  handleChange() {
    let { models: patients } = this.props.collection;
    console.log('-handleChange-', patients);
    if (patients.length > 0) {
      patients = map(patients, async patient => {
        const { attributes } = patient;
        if (attributes.admitted) {
          const admission = await patient.getCurrentAdmission();
          if (!isEmpty(admission)) attributes.dischargeUrl = `/patients/visit/${patient.id}/${admission.id}`;
        }
        return attributes;
      });
    }

    this.forceUpdate();
  }

  goEdit = (patientId) => {
    this.props.history.push(`/patients/editPatient/${patientId}`);
  }

  goAdmit = (patientId) => {
    const patient = this.props.collection.where({ _id: patientId })[0];
    if (patient.get('admitted')) {
      let dischargeUrl = '';
      const admission = patient.getCurrentAdmission();
      if (!isEmpty(admission)) dischargeUrl = `/patients/visit/${patient.id}/${admission.id}`;
      this.props.history.push(dischargeUrl);
    } else {
      this.props.history.push(`/patients/check-in/${patientId}`);
    }
  }

  async onFetchData(state = {}) {
    const { keyword } = this.state;
    const updates = { loading: true };
    if (!isEmpty(state)) updates.tableState = state;
    this.setState(updates);

    try {
      // Set pagination options
      if (state.sorted.length > 0) {
        const sort = head(state.sorted);
        this.props.collection.setSorting(sort.id, sort.desc ? 1 : -1);
      }
      if (keyword) {
        this.props.collection.setKeyword(keyword);
      } else {
        this.props.collection.setKeyword('');
      }

      this.props.collection.setPageSize(state.pageSize);
      await this.props.collection.getPage(state.page);
      this.setState({ loading: false });
    } catch (err) {
      this.setState({ loading: false });
      console.error(err);
    }
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button 
          onClick={() => this.goEdit(row._id)}
          variant="outlined"
        >
          View Patient
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => this.goAdmit(row._id)}
        >
          {row.admitted ? 'Discharge' : 'Admit'}
        </Button>
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
    const { tableClass } = this.state;
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
                pages={this.props.collection.state.totalPages}
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
      </div>
    );
  }
}

PatientListing.defaultProps = {
  collection: new PatientsCollection(),
  patients: []
};

export default PatientListing;
