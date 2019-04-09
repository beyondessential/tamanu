import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { capitalize } from 'lodash';
import { Grid } from '@material-ui/core';
import Medication from './Medication';
import actions from '../../../../actions/patients';
import {
  Preloader, TextInput, DateInput, BottomBar, Container,
  AddButton, UpdateButton, CancelButton, TopBar, FormRow,
} from '../../../../components';
import { ProcedureModel } from '../../../../models';
import { MUI_SPACING_UNIT as spacing } from '../../../../constants';

class Procedure extends Component {
  static propTypes = {
    fetchProcedure: PropTypes.func.isRequired,
    patientId: PropTypes.string.isRequired,
    visitId: PropTypes.string.isRequired,
    procedureModel: PropTypes.oneOfType([
      PropTypes.instanceOf(ProcedureModel),
      PropTypes.instanceOf(Object),
    ]).isRequired,
    saveProcedure: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    action: 'new',
    loading: true,
    formIsValid: false,
  }

  componentWillMount() {
    const { patientId, id } = this.props;
    this.props.fetchProcedure({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    const { procedureModel, action, loading } = newProps;
    if (!loading) {
      procedureModel.on('change', this.handleChange);
      this.setState({
        ...procedureModel.toJSON(),
        formIsValid: procedureModel.isValid(),
        action,
        loading,
      });
    }
  }

  componentWillUnmount() {
    const { procedureModel } = this.props;
    procedureModel.off('change');
  }

  handleUserInput = (event) => {
    const { procedureModel } = this.props;
    const { name, value } = event.target;
    procedureModel.set(name, value);
  }

  handleChange = () => {
    const { procedureModel } = this.props;
    this.setState({
      ...procedureModel.changedAttributes(),
      formIsValid: procedureModel.isValid(),
    });
  }

  submitForm(event) {
    event.preventDefault();
    const { procedureModel, visitId } = this.props;
    const { action } = this.state;
    this.props.saveProcedure({
      action,
      procedureModel,
      visitId,
      history: this.props.history,
    });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const {
      procedureModel, patientId, visitId,
    } = this.props;
    const {
      action, formIsValid, ...form
    } = this.state;
    return (
      <React.Fragment>
        <TopBar
          title={`${capitalize(action)} Procedure`}
        />
        <form onSubmit={this.submitForm}>
          <Container>
            <FormRow>
              <TextInput
                label="Procedure"
                name="description"
                value={form.description}
                onChange={this.handleUserInput}
                required
              />
              <TextInput
                label="CPT Code"
                name="cptCode"
                value={form.cptCode}
                onChange={this.handleUserInput}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Procedure Location"
                name="location"
                value={form.location}
                onChange={this.handleUserInput}
              />
              <DateInput
                label="Procedure Date"
                name="procedureDate"
                value={form.procedureDate}
                onChange={(date) => { this.handleUserInput(date, 'procedureDate'); }}
                required
              />
              <TextInput
                label="Time Start"
                name="timeStarted"
                value={form.timeStarted}
                onChange={this.handleUserInput}
              />
              <TextInput
                label="Time Ended"
                name="timeEnded"
                value={form.timeEnded}
                onChange={this.handleUserInput}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Physician"
                name="physician"
                value={form.physician}
                onChange={this.handleUserInput}
                required
              />
              <TextInput
                label="Assistant"
                name="assistant"
                value={form.assistant}
                onChange={this.handleUserInput}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Anesthesiologist"
                name="anesthesiologist"
                value={form.anesthesiologist}
                onChange={this.handleUserInput}
              />
              <TextInput
                label="Anesthesia Type"
                name="anesthesiaType"
                value={form.anesthesiaType}
                onChange={this.handleUserInput}
              />
            </FormRow>
            <FormRow>
              <TextInput
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={this.handleUserInput}
                multiline
                rows="3"
              />
            </FormRow>
            {action === 'edit'
              && <Medication procedureModel={procedureModel} />
            }
            <BottomBar>
              <CancelButton
                to={`/patients/visit/${patientId}/${visitId}`}
              />
              {action === 'new' && (
              <AddButton
                type="submit"
                disabled={!formIsValid}
                can={{ do: 'create', on: 'procedure' }}
              />
              ) }
              {action !== 'new' && (
              <UpdateButton
                type="submit"
                disabled={!formIsValid}
                can={{ do: 'update', on: 'procedure' }}
              />
              ) }
            </BottomBar>
          </Container>
        </form>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, { match: { params: { patientId, visitId, id } } }) {
  const {
    procedureModel, action, loading, error,
  } = state.patients;
  return {
    procedureModel, action, loading, error, patientId, visitId, id,
  };
}

const { procedure: procedureActions } = actions;
const { fetchProcedure, saveProcedure } = procedureActions;
const mapDispatchToProps = (dispatch) => ({
  fetchProcedure: (params) => dispatch(fetchProcedure(params)),
  saveProcedure: (params) => dispatch(saveProcedure(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Procedure);
