import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import TopRow from '../components/TopRow';
import ActionsTaken from '../components/ActionsTaken';
import PreOpDiagnosis from './PreOpDiagnosis';
import {
  TextInput, Container, TopBar, Preloader, DateInput,
  FormRow, BottomBar, UpdateButton, BackButton,
} from '../../../components';
import { MUI_SPACING_UNIT as spacing } from '../../../constants';
import actions from '../../../actions/patients';
import { PatientModel, OperationReportModel } from '../../../models';

class OperationReport extends Component {
  static propTypes = {
    action: PropTypes.string.isRequired,
    fetchOperationReport: PropTypes.func.isRequired,
    saveOperationReport: PropTypes.func.isRequired,
    operationReportModel: PropTypes.oneOfType([
      PropTypes.instanceOf(OperationReportModel),
      PropTypes.instanceOf(Object),
    ]).isRequired,
    patientModel: PropTypes.oneOfType([
      PropTypes.instanceOf(PatientModel),
      PropTypes.instanceOf(Object),
    ]).isRequired,
  }

  state = {
    loading: true,
    isFormValid: false,
    action: 'new',
  }

  componentDidMount() {
    const { fetchOperationReport } = this.props;
    fetchOperationReport();
  }

  componentWillReceiveProps(newProps) {
    const { action, loading, operationReportModel } = newProps;
    if (!loading) {
      // update state on model change
      operationReportModel
        .off('change')
        .on('change', this.handleChange);
      this.setState({
        ...operationReportModel.toJSON(),
        isFormValid: operationReportModel.isValid(),
        action,
        loading,
      });
    }
  }

  componentWillUnmount() {
    const { operationReportModel } = this.props;
    if (operationReportModel && typeof operationReportModel !== 'undefined') operationReportModel.off('change');
  }

  handleActionsTakenChange = (actionsTaken) => {
    const { operationReportModel } = this.props;
    operationReportModel.set('actionsTaken', actionsTaken);
  }

  handleUserInput = (event) => {
    const { operationReportModel } = this.props;
    const { name, value } = event.target;
    operationReportModel.set(name, value);
  }

  handleChange = () => {
    const { operationReportModel } = this.props;
    const isFormValid = operationReportModel.isValid();
    const changedAttributes = operationReportModel.changedAttributes();
    this.setState({ ...changedAttributes, isFormValid });
  }

  submitForm = (event) => {
    event.preventDefault();
    const { action, saveOperationReport, operationReportModel } = this.props;
    saveOperationReport({ action, operationReportModel });
  }

  render() {
    const { patientModel, operationReportModel } = this.props;
    const {
      loading, isFormValid, action, ...form
    } = this.state;

    if (loading) return <Preloader />;
    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Operation Report`} />
        <Container>
          <TopRow
            patient={patientModel.toJSON()}
            style={{ marginBottom: spacing * 2 }}
          />
          <PreOpDiagnosis operationReportModel={operationReportModel} />
          <form
            name="opPlanForm"
            onSubmit={this.submitForm}
          >
            <FormRow>
              <TextInput
                name="operationDescription"
                label="Operation Description"
                onChange={this.handleUserInput}
                value={form.operationDescription}
                multiline
                rows="3"
              />
            </FormRow>
            <ActionsTaken
              actionsTaken={form.actionsTaken}
              patientModel={patientModel}
              onChange={this.handleActionsTakenChange}
            />
            <FormRow>
              <DateInput
                name="surgeryDate"
                label="Surgery Date"
                onChange={this.handleUserInput}
                value={form.surgeryDate}
              />
              <TextInput
                name="surgeon"
                label="Surgeon"
                onChange={this.handleUserInput}
                value={form.surgeon}
              />
              <TextInput
                name="assistant"
                label="Assistant"
                onChange={this.handleUserInput}
                value={form.surgeon}
              />
              <TextInput
                name="caseComplexity"
                label="Case Complexity"
                onChange={this.handleUserInput}
                value={form.caseComplexity}
              />
            </FormRow>
            <FormRow>
              <TextInput
                name="additionalNotes"
                label="Additional Notes"
                onChange={this.handleUserInput}
                value={form.additionalNotes}
                multiline
                rows="3"
              />
            </FormRow>
            <BottomBar>
              <BackButton />
              <UpdateButton
                type="submit"
                disabled={!isFormValid}
              />
            </BottomBar>
          </form>
        </Container>
      </React.Fragment>
    );
  }
}

function mapStateToProps({ patients }, { match: { params: { patientId, visitId, id } } }) {
  const {
    patient: patientModel, operationReportModel, loading, action,
  } = patients;
  return {
    patientModel, operationReportModel, loading, action, patientId, visitId, id,
  };
}

const { operationReport: operationReportActions } = actions;
const { fetchOperationReport, saveOperationReport } = operationReportActions;
const mapDispatchToProps = (dispatch, {
  history,
  match: { params: { id = null, patientId } },
}) => ({
  fetchOperationReport: () => dispatch(fetchOperationReport({ id, patientId })),
  saveOperationReport: ({ ...props }) => dispatch(saveOperationReport({
    ...props,
    history,
  })),
});

export default connect(mapStateToProps, mapDispatchToProps)(OperationReport);
