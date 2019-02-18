import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { capitalize } from 'lodash';
import Medication from './Medication';
import actions from '../../../../actions/patients';
import {
  Preloader,
  InputGroup,
  TextareaGroup,
  DatepickerGroup,
  AddButton,
  UpdateButton,
  CancelButton,
} from '../../../../components';

class Procedure extends Component {
  constructor(props) {
    super(props);
    this.submitForm = this.submitForm.bind(this);
  }

  state = {
    action: 'new',
    procedure: {},
    loading: true,
  }

  componentWillMount() {
    const { patientId, id } = this.props.match.params;
    this.props.fetchProcedure({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  componentWillUnmount() {
    const { procedureModel } = this.state;
    procedureModel.off('change');
  }

  handleChange(props = this.props) {
    const { procedure, action, loading } = props;
    if (!loading) {
      procedure.on('change', () => this.forceUpdate());
      this.setState({
        procedureModel: procedure,
        procedure: procedure.toJSON(),
        action,
        loading,
      });
    }
  }

  handleUserInput = (e, field) => {
    const { procedureModel } = this.state;
    if (typeof field !== 'undefined') {
      procedureModel.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      procedureModel.set(name, value, { silent: true });
    }
    this.setState({
      procedureModel,
      procedure: procedureModel.toJSON(),
    });
  }

  submitForm(e) {
    e.preventDefault();
    const { visitId } = this.props.match.params;
    const { action, procedureModel } = this.state;
    this.props.saveProcedure({
      action,
      procedureModel,
      visitId,
      history: this.props.history
    });
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { patientId, visitId } = this.props.match.params;
    const { action, procedureModel, procedure } = this.state;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>{`${capitalize(action)} Procedure`}</span>
          </div>
          <form
            className="create-container"
            onSubmit={this.submitForm}
          >
            <div className="form formLayout">
              <div className="columns">
                <InputGroup
                  label="Procedure"
                  name="description"
                  value={procedure.description}
                  onChange={this.handleUserInput}
                  required
                />
              </div>
              <div className="columns">
                <InputGroup
                  label="CPT Code"
                  name="cptCode"
                  value={procedure.cptCode}
                  onChange={this.handleUserInput}
                />
              </div>
              <div className="columns">
                <InputGroup
                  label="Procedure Location"
                  name="location"
                  className="column is-3"
                  value={procedure.location}
                  onChange={this.handleUserInput}
                />
                <DatepickerGroup
                  label="Procedure Date"
                  name="procedureDate"
                  className="column is-3"
                  value={procedure.procedureDate}
                  onChange={(date) => { this.handleUserInput(date, 'procedureDate'); }}
                  required
                />
                <InputGroup
                  label="Time Start"
                  name="timeStarted"
                  className="column is-3"
                  value={procedure.timeStarted}
                  onChange={this.handleUserInput}
                />
                <InputGroup
                  label="Time Ended"
                  name="timeEnded"
                  className="column is-3"
                  value={procedure.timeEnded}
                  onChange={this.handleUserInput}
                />
              </div>
              <div className="columns">
                <InputGroup
                  label="Physician"
                  name="physician"
                  className="column is-4"
                  value={procedure.physician}
                  onChange={this.handleUserInput}
                  required
                />
                <InputGroup
                  label="Assistant"
                  name="assistant"
                  className="column is-4"
                  value={procedure.assistant}
                  onChange={this.handleUserInput}
                />
                <InputGroup
                  label="Anesthesiologist"
                  name="anesthesiologist"
                  className="column is-4"
                  value={procedure.anesthesiologist}
                  onChange={this.handleUserInput}
                />
              </div>
              <div className="columns">
                <InputGroup
                  label="Anesthesia Type"
                  name="anesthesiaType"
                  className="column is-4"
                  value={procedure.anesthesiaType}
                  onChange={this.handleUserInput}
                />
              </div>
              <div className="columns">
                <div className="column">
                  <TextareaGroup
                    label="Notes"
                    name="notes"
                    value={procedure.notes}
                    onChange={this.handleUserInput}
                  />
                </div>
              </div>
              {action === 'edit' &&
                <Medication
                  procedureModel={procedureModel}
                />
              }
              <div className="column has-text-right">
                <CancelButton
                  to={`/patients/visit/${patientId}/${visitId}`} />
                {action === 'new' && <AddButton
                                      type="submit"
                                      disabled={!procedureModel.isValid()}
                                      can={{ do: 'create', on: 'procedure' }} /> }
                {action !== 'new' && <UpdateButton
                                      type="submit"
                                      disabled={!procedureModel.isValid()}
                                      can={{ do: 'update', on: 'procedure' }}/> }
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
  const { procedure, action, loading, error } = state.patients;
  return { procedure, action, loading, error };
}

const { procedure: procedureActions } = actions;
const { fetchProcedure, saveProcedure } = procedureActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  fetchProcedure: (params) => dispatch(fetchProcedure(params)),
  saveProcedure: (params) => dispatch(saveProcedure(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Procedure);
