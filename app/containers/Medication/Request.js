import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import actions from '../../actions/medication';
import { dateFormat } from '../../constants';
import {
  Preloader,
  PatientAutocomplete,
  CustomDateInput,
  InputGroup,
  DrugAutocomplete,
  TextareaGroup,
  DatepickerGroup,
} from '../../components';

class NewMedication extends Component {
  constructor(props) {
    super(props);
    this.selectPatient = this.selectPatient.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    action: 'new',
    visit: '',
    patient: {},
    medication: {},
    visits: [],
    loading: true,
  }

  componentWillMount() {
    const { patientId, id } = this.props.match.params;
    this.props.fetchMedication({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  // componentWillUnmount() {
  //   const { visit } = this.props;
  //   // visit.off('change');
  // }

  selectPatient = (patientId) => {
    const { id } = this.props.match.params;
    this.props.fetchMedication({ patientId, id });
  }

  selectVisit = (visitId) => {
    const { id } = this.props.match.params;
    this.setState({ visit: visitId });
    // this.props.fetchMedication({ visitId, id });
  }

  handleChange(props = this.props) {
    const { patient, medication, loading } = props;
    if (!loading) {
      this.setState({
        medicationModel: medication,
        medication: medication.toJSON(),
        visits: patient.getVisitsSelect(),
        loading,
      });
    }
  }

  handleUserInput = (e, field) => {
    const { medicationModel } = this.state;
    if (typeof field !== 'undefined') {
      medicationModel.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      medicationModel.set(name, value, { silent: true });
    }
    this.setState({ medicationModel });
  }

  submitForm(e) {
    console.log('-submitForm-');
    e.preventDefault();
    const { action, medicationModel, patientModel, visit } = this.state;
    console.log({ action, medicationModel, patientModel, visit });
    // this.props.saveMedication({ action, visitModel, patientModel, history: this.props.history, setStatus });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { visit, visits, medicationModel, medication } = this.state;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span> New Medication Request </span>
          </div>
          <form
            className="create-container"
            onSubmit={this.submitForm}
          >
            <div className="form">
              <div className="columns">
                <div className="column">
                  <PatientAutocomplete
                    label="Patient"
                    name="patient"
                    onChange={this.selectPatient}
                    required
                  />
                </div>
                <div className="column">
                  <div className="column">
                    <span className="header">
                      Visit <span className="isRequired">*</span>
                    </span>
                    <Select
                      options={visits}
                      simpleValue
                      name="visit"
                      value={visit}
                      onChange={this.selectVisit}
                      placeholder={visits.length > 0 ? 'Select a Visit' : 'Add a Visit'}
                    />
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <DrugAutocomplete
                    name="drug"
                    label="Medication"
                    onChange={this.handleUserInput}
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="prescription"
                    label="Prescription"
                    onChange={this.handleUserInput}
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-5">
                  <DatepickerGroup
                    label="Prescription Date"
                    name="prescriptionDate"
                    onChange={this.handleUserInput}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <div className="column">
                    <span className="header">
                      Quantity <span className="isRequired">*</span>
                    </span>
                    <div className="columns is-gapless">
                      <div className="column">
                        <InputGroup
                          type="number"
                          label="Morning"
                          className="is-horizontal m-b-0"
                          labelClass="column is-4 p-t-15"
                          inputClass="column is-7"
                          name="refills"
                        />
                        <InputGroup
                          type="number"
                          label="Evening"
                          className="is-horizontal m-b-0"
                          labelClass="column is-4 p-t-15"
                          inputClass="column is-7"
                          name="refills"
                        />
                      </div>
                      <div className="column">
                        <InputGroup
                          type="number"
                          label="Lunch"
                          className="is-horizontal m-b-0"
                          labelClass="column is-4 p-t-15"
                          inputClass="column is-7"
                          name="refills"
                        />
                        <InputGroup
                          type="number"
                          label="Night"
                          className="is-horizontal m-b-0"
                          labelClass="column is-4 p-t-15"
                          inputClass="column is-7"
                          name="refills"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="refills"
                    label="Refills"
                  />
                </div>
              </div>
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/medication">Cancel</Link>
                <button className="button is-primary" type="submit" disabled={!medicationModel.isValid() && 1 === 2}>Add</button>
              </div>
            </div>
          </form>
        </div>
        {/* <ModalView
          isVisible={formError}
          onClose={this.onCloseModal}
          headerTitle="Warning!!!!"
          contentText="Please fill in required fields (marked with *) and correct the errors before saving."
          little
        /> */}
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, medication, loading, error } = state.medication;
  return { patient, medication, loading, error };
}

const { request: requestActions } = actions;
const { fetchMedication, saveMedication } = requestActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  fetchMedication: (params) => dispatch(fetchMedication(params)),
  saveMedication: (params) => dispatch(saveMedication(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewMedication);
