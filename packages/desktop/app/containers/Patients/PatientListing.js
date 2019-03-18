import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { map, isEmpty, head } from 'lodash';
import ReactTable from 'react-table';
import { toast } from 'react-toastify';
import { Button, SyncIconButton, TopBar } from '../../components';
import { pageSizes, patientColumns } from '../../constants';
import { PatientsCollection } from '../../collections';
import { HospitalModel } from '../../models';

class PatientListing extends Component {
  constructor(props) {
    super(props);
    this.setActionsColumn = this.setActionsColumn.bind(this);
    this.onFetchData = this.onFetchData.bind(this);
    this.searchSubmit = this.searchSubmit.bind(this);
    this.searchReset = this.searchReset.bind(this);
  }

  state = {
    keyword: '',
    tableClass: '',
    tableState: {},
    loading: true,
  }

  async componentDidMount() {
    patientColumns[0].Cell = this.setSyncStatus;
    patientColumns[patientColumns.length - 1].Cell = this.setActionsColumn;
    this.props.collection.on('update', this.handleChange());
  }

  componentWillUnmount() {
    this.props.collection.off('update', this.handleChange());
  }

  handleChange() {
    let { models: patients } = this.props.collection;
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

      await this.props.collection.getPage(
        state.page,
        { pageSize: state.pageSize }
      );
      this.setState({ loading: false });
    } catch (err) {
      this.setState({ loading: false });
      console.error(err);
    }
  }

  setSyncStatus = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        {!row.fullySynced &&
          this._drawSyncBtn(row, _row.value)
        }

        {row.fullySynced &&
          this._drawSyncedIcon(_row.value)
        }
      </div>
    );
  }

  _drawSyncBtn = (row, text) => {
    return <React.Fragment>
      <SyncIconButton
        onClick={(e) => {
          e.preventDefault();
          this.syncItem(row);
        }} />
      <span> {text} </span>
    </React.Fragment>;
  }

  _drawSyncedIcon = (text) => {
    return <React.Fragment>
      <SyncIconButton disabled />
      <span> {text} </span>
    </React.Fragment>;
  }

  syncItem = async ({ _id }) => {
    try {
      // fetch hospitals info
      const key = `patient-${_id}`;
      const hospitalModel = new HospitalModel();
      await hospitalModel.fetch();
      const hospital = hospitalModel.toJSON();
      // attach the object
      const objectsFullySynced = hospital.objectsFullySynced.splice(0);
      if (!objectsFullySynced.includes(key)) {
        objectsFullySynced.push(key);
        hospitalModel.set('objectsFullySynced', objectsFullySynced, { silent: true });
        await hospitalModel.save();
        toast('Item added to the queue.', { type: toast.TYPE.SUCCESS });
      } else {
        toast('Item already in queue!', { type: toast.TYPE.WARNING });
      }
    } catch (e) {
      console.error(e);
      toast('Something west wrong, please try again later.', { type: toast.TYPE.ERROR });
    }
  }

  setActionsColumn = _row => {
    const row = _row.original;
    return (
      <div key={row._id}>
        <Button
          onClick={() => this.goEdit(row._id)}
          can={{ do: 'read', on: 'patient' }}
          variant="outlined"
        >
          View Patient
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={() => this.goAdmit(row._id)}
          can={{ do: 'update', on: 'patient', field: 'admitted' }}
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
    const { tableClass, loading } = this.state;
    let { models: patients } = this.props.collection;
    if (patients.length > 0) patients = map(patients, patient => patient.attributes);
    return (
      <div className="content">
        <TopBar
          title="Patient Listing"
          search={{
            onSubmit: this.searchSubmit,
            onClear: this.searchReset
          }}
          buttons={[{
            to: "/patients/edit/new",
            color: "secondary",
            variant: "contained",
            children: 'Advanced Search'
          }, {
            to: "/patients/edit/new",
            can: { do: 'create', on: 'patient' },
            children: 'New Patient'
          }]}
        />
        <div className="detail">
          {patients.length === 0 && !loading && // Loaded and no records
            <div className="notification">
              <span>
                No patients found. <Link to="/patients/edit/new">Create a new patient record?</Link>
              </span>
            </div>
          }
          {(patients.length > 0 || loading) && // Loading or there's records
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
