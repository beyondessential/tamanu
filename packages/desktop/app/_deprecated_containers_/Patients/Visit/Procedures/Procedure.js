import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { capitalize } from 'lodash';
import Medication from './Medication';
import actions from '../../../../actions/patients';
import {
  Preloader,
  TextField,
  DateField,
  BottomBar,
  Container,
  AddButton,
  UpdateButton,
  CancelButton,
  TopBar,
  FormRow,
  Form,
  Field,
} from '../../../../components';
import { ProcedureModel } from '../../../../models';

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
    action: PropTypes.string,
  };

  static defaultProps = {
    action: 'new',
  };

  state = {
    loading: true,
  };

  componentWillMount() {
    const { patientId, id } = this.props;
    this.props.fetchProcedure({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    const { loading } = newProps;
    if (!loading) this.setState({ loading: false });
  }

  submitForm = (values, { setSubmitting }) => {
    const { procedureModel, visitId, action } = this.props;
    procedureModel.set(values);
    this.props.saveProcedure({
      action,
      procedureModel,
      visitId,
      setSubmitting,
    });
  };

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { procedureModel, patientId, visitId, action } = this.props;
    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Procedure`} />
        <Form
          onSubmit={this.submitForm}
          initialValues={procedureModel.toJSON()}
          validationSchema={procedureModel.validationSchema}
          render={({ isSubmitting }) => (
            <Container>
              <FormRow>
                <Field component={TextField} label="Procedure" name="description" required />
                <Field component={TextField} label="CPT Code" name="cptCode" />
              </FormRow>
              <FormRow>
                <Field component={TextField} label="Procedure Location" name="location" />
                <Field component={DateField} label="Procedure Date" name="procedureDate" required />
                <Field component={TextField} label="Time Start" name="timeStarted" />
                <Field component={TextField} label="Time Ended" name="timeEnded" />
              </FormRow>
              <FormRow>
                <Field component={TextField} label="Physician" name="physician" required />
                <Field component={TextField} label="Assistant" name="assistant" />
              </FormRow>
              <FormRow>
                <Field component={TextField} label="Anesthesiologist" name="anesthesiologist" />
                <Field component={TextField} label="Anesthesia Type" name="anesthesiaType" />
              </FormRow>
              <FormRow>
                <Field component={TextField} label="Notes" name="notes" multiline rows="3" />
              </FormRow>
              {action === 'edit' && <Medication procedureModel={procedureModel} />}
              <BottomBar>
                <CancelButton to={`/patients/visit/${patientId}/${visitId}`} />
                {action === 'new' ? (
                  <AddButton
                    type="submit"
                    isSubmitting={isSubmitting}
                    can={{ do: 'create', on: 'procedure' }}
                  />
                ) : (
                  <UpdateButton
                    type="submit"
                    isSubmitting={isSubmitting}
                    can={{ do: 'update', on: 'procedure' }}
                  />
                )}
              </BottomBar>
            </Container>
          )}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(
  state,
  {
    match: {
      params: { patientId, visitId, id },
    },
  },
) {
  const { procedureModel, action, loading, error } = state.patients;
  return {
    procedureModel,
    action,
    loading,
    error,
    patientId,
    visitId,
    id,
  };
}

const { procedure: procedureActions } = actions;
const { fetchProcedure, saveProcedure } = procedureActions;
const mapDispatchToProps = (dispatch, { history }) => ({
  fetchProcedure: params => dispatch(fetchProcedure(params)),
  saveProcedure: params => dispatch(saveProcedure({ history, ...params })),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Procedure);
