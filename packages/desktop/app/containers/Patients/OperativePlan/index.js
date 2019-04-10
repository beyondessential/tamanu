import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { capitalize } from 'lodash';
import TopRow from '../components/TopRow';
import ActionsTaken from '../components/ActionsTaken';
import {
  TextInput, Container, TopBar, Preloader,
  FormRow, BottomBar, AddButton, UpdateButton, CancelButton,
  Button, SelectInput, PatientRelationSelect,
} from '../../../components';
import {
  MUI_SPACING_UNIT as spacing, operativePlanStatuses,
  operativePlanStatusList, VISIT_SELECT_TEMPLATE,
} from '../../../constants';
import actions from '../../../actions/patients';
import { PatientModel, OperativePlanModel } from '../../../models';

class OperativePlan extends Component {
  static propTypes = {
    action: PropTypes.string.isRequired,
    fetchOperativePlan: PropTypes.func.isRequired,
    saveOperativePlan: PropTypes.func.isRequired,
    operativePlanModel: PropTypes.oneOfType([
      PropTypes.instanceOf(OperativePlanModel),
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
    const { fetchOperativePlan } = this.props;
    fetchOperativePlan();
  }

  componentWillReceiveProps(newProps) {
    const { action, loading, operativePlanModel } = newProps;
    if (!loading) {
      // update state on model change
      operativePlanModel
        .off('change')
        .on('change', this.handleChange);
      this.setState({
        ...operativePlanModel.toJSON(),
        action,
        loading,
      });
    }
  }

  componentWillUnmount() {
    const { operativePlanModel } = this.props;
    if (operativePlanModel && typeof operativePlanModel !== 'undefined') operativePlanModel.off('change');
  }

  handleActionsTakenChange = (actionsTaken) => {
    const { operativePlanModel } = this.props;
    operativePlanModel.set({ actionsTaken });
  }

  handleUserInput = (event) => {
    const { operativePlanModel } = this.props;
    const { name, value } = event.target;
    operativePlanModel.set({ [name]: value });
  }

  handleChange = () => {
    const { operativePlanModel } = this.props;
    const isFormValid = operativePlanModel.isValid();
    const changedAttributes = operativePlanModel.changedAttributes();
    this.setState({ ...changedAttributes, isFormValid });
  }

  markComplete = (event) => {
    const { operativePlanModel } = this.props;
    operativePlanModel.set({ status: operativePlanStatuses.COMPLETED });
    this.submitForm(event);
  }

  submitForm = (event) => {
    event.preventDefault();
    const { action, saveOperativePlan, operativePlanModel } = this.props;
    saveOperativePlan({ action, operativePlanModel });
  }

  render() {
    const { patientModel } = this.props;
    const {
      loading, isFormValid, action, ...form
    } = this.state;

    if (loading) return <Preloader />;
    return (
      <React.Fragment>
        <TopBar title={`${capitalize(action)} Operative Plan`} />
        <Container>
          <TopRow
            patient={patientModel.toJSON()}
            style={{ marginBottom: spacing * 2 }}
          />
          <form
            name="opPlanForm"
            onSubmit={this.submitForm}
          >
            {action === 'new'
              && (
                <FormRow xs={5}>
                  <PatientRelationSelect
                    patient={patientModel}
                    relation="visits"
                    template={VISIT_SELECT_TEMPLATE}
                    label="Visit"
                    name="visit"
                    onChange={this.handleUserInput}
                    value={form.visit}
                  />
                </FormRow>
              )
            }
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
              <TextInput
                name="surgeon"
                label="Surgeon"
                onChange={this.handleUserInput}
                value={form.surgeon}
              />
              <SelectInput
                label="Status"
                options={operativePlanStatusList}
                name="status"
                disabled={this.state.disabled}
                value={form.status}
                onChange={(value) => { this.handleUserInput(value, 'status'); }}
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
                name="admissionInstructions"
                label="Instructions Upon Admission"
                onChange={this.handleUserInput}
                value={form.admissionInstructions}
                multiline
                rows="3"
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
              <CancelButton
                to={`/patients/editPatient/${patientModel.id}`}
              />
              {action === 'new'
                ? (
                  <AddButton type="submit" />
                )
                : (
                  <React.Fragment>
                    <UpdateButton type="submit" />
                    <Button
                      onClick={this.markComplete}
                      color="secondary"
                      variant="contained"
                    >
                      Complete Plan
                    </Button>
                  </React.Fragment>
                )
              }
            </BottomBar>
          </form>
        </Container>
        {/*
        <Dialog
          isVisible={markedCompleted}
          onClose={this.onCloseCompletedModal}
          headerTitle="Success!"
          contentText="Operative Plan was marked completed successfully, you'll be redirected to Operation Report now"
          little
        /> */}
      </React.Fragment>
    );
  }
}

function mapStateToProps({ patients }, { match: { params: { patientId, visitId, id } } }) {
  const {
    patient: patientModel, operativePlanModel, loading, action,
  } = patients;
  return {
    patientModel, operativePlanModel, loading, action, patientId, visitId, id,
  };
}

const { operativePlan: operativePlanActions } = actions;
const { fetchOperativePlan, saveOperativePlan } = operativePlanActions;
const mapDispatchToProps = (dispatch, {
  history,
  match: { params: { id = null, patientId } },
}) => ({
  fetchOperativePlan: () => dispatch(fetchOperativePlan({ id, patientId })),
  saveOperativePlan: ({ ...props }) => dispatch(saveOperativePlan({
    ...props,
    history,
    patientId,
  })),
});

export default connect(mapStateToProps, mapDispatchToProps)(OperativePlan);
