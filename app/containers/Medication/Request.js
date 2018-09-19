import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import actions from '../../actions/medication';
import TopRow from '../Patients/components/TopRow';
import {
  Preloader,
  PatientAutocomplete,
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
    byPatient: false
  }

  componentWillMount() {
    const { patientId, id } = this.props.match.params;
    this.props.fetchMedication({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  componentWillUnmount() {
    // const { visit } = this.props;
    // visit.off('change');
  }

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
    const { patientId } = this.props.match.params;
    const { patient, medication, loading } = props;
    let byPatient = false;
    if (!loading) {
      if (patientId) byPatient = true;
      this.setState({
        patient,
        medicationModel: medication,
        medication: medication.toJSON(),
        visits: patient.getVisitsSelect(),
        loading,
        byPatient,
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
    e.preventDefault();
    const { action, medicationModel, patient, visit } = this.state;
    this.props.saveMedication({
      action,
      model: medicationModel,
      visitId: visit,
      patientId: patient.id,
      history: this.props.history
    });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const {
      visit,
      visits,
      medicationModel,
      medication,
      patient,
      byPatient,
    } = this.state;

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
            {byPatient &&
              <div className="form p-d-15">
                <TopRow patient={patient.toJSON()} />
              </div>
            }
            <div className="form with-padding">
              <div className="columns">
                {!byPatient &&
                  <PatientAutocomplete
                    label="Patient"
                    name="patient"
                    onChange={this.selectPatient}
                    value={medication.patient}
                    required
                  />
                }
                <div className="column is-half">
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
              <div className="columns">
                <DrugAutocomplete
                  name="drug"
                  label="Medication"
                  onChange={this.handleUserInput}
                  value={medication.drug}
                  required
                />
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    name="prescription"
                    label="Prescription"
                    onChange={this.handleUserInput}
                    value={medication.prescription}
                    required
                  />
                </div>
              </div>
              <div className="columns">
                <DatepickerGroup
                  label="Prescription Date"
                  name="prescriptionDate"
                  className="is-3"
                  onChange={this.handleUserInput}
                  value={medication.prescriptionDate}
                />
              </div>
              <div className="columns">
                <div className="column is-4">
                  <span className="header">
                    Quantity
                  </span>
                  <div className="columns is-gapless">
                    <div className="column">
                      <InputGroup
                        type="number"
                        label="Morning"
                        className="is-horizontal m-b-0"
                        labelClass="column is-5 p-t-10 p-l-3 p-r-0"
                        inputClass="column is-7 p-t-5"
                        name="qtyMorning"
                        value={medication.qtyMorning}
                        onChange={this.handleUserInput}
                        required
                      />
                      <InputGroup
                        type="number"
                        label="Evening"
                        className="is-horizontal m-b-0"
                        labelClass="column is-5 p-t-10 p-l-3 p-r-0"
                        inputClass="column is-7 p-t-5"
                        name="qtyEvening"
                        value={medication.qtyEvening}
                        onChange={this.handleUserInput}
                        required
                      />
                    </div>
                    <div className="column">
                      <InputGroup
                        type="number"
                        label="Lunch"
                        className="is-horizontal m-b-0"
                        labelClass="column is-5 p-t-10 p-l-3 p-r-0"
                        inputClass="column is-7 p-t-5"
                        name="qtyLunch"
                        value={medication.qtyLunch}
                        onChange={this.handleUserInput}
                        required
                      />
                      <InputGroup
                        type="number"
                        label="Night"
                        className="is-horizontal m-b-0"
                        labelClass="column is-5 p-t-10 p-l-3 p-r-0"
                        inputClass="column is-7 p-t-5"
                        name="qtyNight"
                        value={medication.qtyNight}
                        onChange={this.handleUserInput}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="column is-4">
                  <TextareaGroup
                    name="notes"
                    label="Notes"
                    onChange={this.handleUserInput}
                    value={medication.notes}
                  />
                </div>
              </div>
              <div className="columns">
                <DatepickerGroup
                  label="End Date"
                  name="endDate"
                  className="is-3 p-t-0"
                  onChange={this.handleUserInput}
                  value={medication.endDate}
                />
              </div>
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to="/medication">Cancel</Link>
                <button className="button is-primary" type="submit" disabled={!medicationModel.isValid()}>Add</button>
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
