import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import actions from '../../actions/medication';
import TopRow from '../Patients/components/TopRow';
import { medicationStatuses, MUI_SPACING_UNIT as spacing } from '../../constants';
import {
  Preloader, PatientAutocomplete, TextInput, DrugAutocomplete,
  DateInput, BackButton, AddButton, UpdateButton,
  TopBar, FormRow, Container, SelectInput,
} from '../../components';

class NewMedication extends Component {
  constructor(props) {
    super(props);
    this.selectPatient = this.selectPatient.bind(this);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    action: 'new',
    patient: {},
    medication: {},
    formIsValid: false,
    visits: [],
    loading: true,
    byPatient: false,
  }

  componentWillMount() {
    const { patientId, id } = this.props.match.params;
    this.props.fetchMedication({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    this.handleNewProps(newProps);
  }

  selectPatient = ({ _id: patientId }) => {
    const { id } = this.props.match.params;
    this.props.fetchMedication({ patientId, id });
  }

  selectDrug = ({ _id: drugId }, name) => {
    this.handleFormInput(name, { _id: drugId });
  }

  handleUserInput = (event) => {
    const { name, value } = event.target;
    this.handleFormInput(name, value);
  }

  handleFormInput = (name, value) => {
    const { medicationModel } = this.props;
    medicationModel.set(name, value, { silent: true });
    this.setState({
      medication: medicationModel.toJSON(),
      formIsValid: medicationModel.isValid(),
    });
  }

  handleNewProps(props = this.props) {
    const { patientId } = this.props.match.params;
    const { patient, loading } = props;
    let byPatient = false;
    if (!loading) {
      if (patientId) byPatient = true;
      this.setState({
        patient,
        visits: patient.getVisitsSelect(),
        loading,
        byPatient,
      });
    }
  }

  submitForm(event) {
    event.preventDefault();
    const { dispense, medicationModel } = this.props;
    const { action, patient } = this.state;
    if (dispense) {
      medicationModel.set('dispense', true);
      medicationModel.set('status', medicationStatuses.FULFILLED);
    }
    this.props.saveMedication({
      action,
      medicationModel,
      patientId: patient.id,
      history: this.props.history,
    });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { dispense } = this.props;
    const {
      action,
      visits,
      patient,
      byPatient,
      medication,
      formIsValid,
    } = this.state;
    return (
      <React.Fragment>
        <TopBar
          title={dispense ? 'Dispense Medication' : 'New Medication Request'}
        />
        <form onSubmit={this.submitForm}>
          <Container>
            <Grid container spacing={spacing * 2} direction="column">
              {byPatient
                && <TopRow patient={patient.toJSON()} />
              }
              <FormRow>
                {!byPatient
                  && (
                  <PatientAutocomplete
                    label="Patient"
                    name="patient"
                    onChange={this.selectPatient}
                    value={medication.patient}
                    required
                  />
                  )
                }
                <SelectInput
                  label="Visit"
                  options={visits}
                  name="visit"
                  value={medication.visit}
                  onChange={this.handleUserInput}
                />
              </FormRow>
              <Grid item>
                <DrugAutocomplete
                  name="drug"
                  label="Medication"
                  onChange={this.selectDrug}
                  value={medication.drug}
                  required
                />
              </Grid>
              <Grid item>
                <TextInput
                  name="prescription"
                  label="Prescription"
                  onChange={this.handleUserInput}
                  value={medication.prescription}
                  rows="2"
                  multiline
                  required
                />
              </Grid>
              <FormRow>
                <DateInput
                  label="Prescription Date"
                  name="prescriptionDate"
                  onChange={this.handleUserInput}
                  value={medication.prescriptionDate}
                />
                <DateInput
                  label="End Date"
                  name="endDate"
                  onChange={this.handleUserInput}
                  value={medication.endDate}
                />
              </FormRow>
              <Grid container item>
                <TextInput
                  name="notes"
                  label="Notes"
                  onChange={this.handleUserInput}
                  value={medication.notes}
                  rows="2"
                  multiline
                />
              </Grid>
              <Grid
                container
                item
                style={{ paddingTop: spacing * 2 }}
                xs={6}
                spacing={spacing * 2}
              >
                <Grid item style={{ paddingBottom: 0 }}>
                  <Typography variant="h6">
                    Quantity
                  </Typography>
                </Grid>
                <FormRow>
                  <TextInput
                    type="number"
                    label="Morning"
                    name="qtyMorning"
                    value={medication.qtyMorning}
                    onChange={this.handleUserInput}
                    required
                  />
                  <TextInput
                    type="number"
                    label="Evening"
                    name="qtyEvening"
                    value={medication.qtyEvening}
                    onChange={this.handleUserInput}
                    required
                  />
                </FormRow>
                <FormRow>
                  <TextInput
                    type="number"
                    label="Lunch"
                    name="qtyLunch"
                    value={medication.qtyLunch}
                    onChange={this.handleUserInput}
                    required
                  />
                  <TextInput
                    type="number"
                    label="Night"
                    name="qtyNight"
                    value={medication.qtyNight}
                    onChange={this.handleUserInput}
                    required
                  />
                </FormRow>
              </Grid>
              <Grid container item justify="flex-end">
                <BackButton />
                {action === 'new'
                  ? (
                    <AddButton
                      type="submit"
                      disabled={!formIsValid}
                      can={{ do: 'create', on: 'medication' }}
                    />
                  )
                  : (
                    <UpdateButton
                      type="submit"
                      disabled={!formIsValid}
                      can={{ do: 'update', on: 'medication' }}
                    />
                  )
                }
              </Grid>
            </Grid>
          </Container>
        </form>
      </React.Fragment>
    );
  }
}

NewMedication.propTypes = {
  fetchMedication: PropTypes.func.isRequired,
  saveMedication: PropTypes.func.isRequired,
  dispense: PropTypes.bool,
  medicationModel: PropTypes.instanceOf(Object).isRequired,
};

NewMedication.defaultProps = {
  dispense: false,
};

function mapStateToProps(state) {
  const {
    patient, medicationModel, loading, error,
  } = state.medication;
  return {
    medicationModel,
    patient,
    loading,
    error,
  };
}

const { request: requestActions } = actions;
const { fetchMedication, saveMedication } = requestActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  fetchMedication: (params) => dispatch(fetchMedication(params)),
  saveMedication: (params) => dispatch(saveMedication(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewMedication);
