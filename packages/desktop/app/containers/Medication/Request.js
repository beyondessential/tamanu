import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Grid, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import actions from '../../actions/medication';
import TopRow from '../Patients/components/TopRow';
import { medicationStatuses, MUI_SPACING_UNIT as spacing, VISIT_SELECT_TEMPLATE } from '../../constants';
import {
  Preloader, PatientAutocomplete, TextInput, DrugAutocomplete,
  DateInput, BackButton, AddButton, UpdateButton, PatientVisitSelect,
  TopBar, FormRow, Container,
} from '../../components';

class NewMedication extends Component {
  state = {
    action: 'new',
    medication: {},
    formIsValid: false,
    loading: true,
  }

  componentWillMount() {
    this.props.fetchMedication();
  }

  componentWillReceiveProps(newProps) {
    this.handleNewProps(newProps);
  }

  selectPatient = ({ _id: patientId }) => {
    this.props.fetchMedication({ patientId });
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

  submitForm = (event) => {
    event.preventDefault();
    const { dispense, medicationModel, patientModel } = this.props;
    const { action } = this.state;
    if (dispense) {
      medicationModel.set('dispense', true);
      medicationModel.set('status', medicationStatuses.FULFILLED);
    }
    this.props.saveMedication({
      action,
      medicationModel,
      patientId: patientModel.id,
      history: this.props.history,
    });
  }

  handleNewProps(props = this.props) {
    const { id, loading } = props;
    if (!loading) {
      this.setState({ loading, action: id ? 'edit' : 'new' });
    }
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { dispense, patientModel, byPatient } = this.props;
    const {
      action,
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
            {byPatient
              && <TopRow patient={patientModel.toJSON()} />
            }
            <Grid container spacing={spacing * 2} direction="column">
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
                <PatientVisitSelect
                  patientModel={patientModel}
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
  patientModel: PropTypes.instanceOf(Object),
  byPatient: PropTypes.bool,
};

NewMedication.defaultProps = {
  dispense: false,
  byPatient: false,
  patientModel: {},
};

const mapStateToProps = ({
  medication: {
    patient, medicationModel, loading, error,
  },
}) => ({
  medicationModel,
  patientModel: patient,
  loading,
  error,
});

const { request: requestActions } = actions;
const { fetchMedication, saveMedication } = requestActions;
const mapDispatchToProps = (dispatch, { match: { params: { patientId, id } } }) => ({
  fetchMedication: props => dispatch(fetchMedication({ patientId, id, ...props })),
  saveMedication: (params) => dispatch(saveMedication(params)),
  byPatient: !!patientId,
});

export default connect(mapStateToProps, mapDispatchToProps)(NewMedication);
