import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { capitalize } from 'lodash';
import { Grid, Tab, Tabs } from '@material-ui/core';

import TopRow from '../components/TopRow';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import Procedure from '../components/Procedure';
import OperativePlan from '../components/OperativePlan';
import OperationReport from '../components/OperationReport';
import LabRequests from '../components/LabRequests';
import Vitals from './Vitals';
import Notes from './Notes';
import Procedures from './Procedures';
import actions from '../../../actions/patients';
import {
  Preloader, TextInput, DateInput, TopBar, BottomBar,
  AddButton, UpdateButton, CancelButton, SelectInput,
  DischargeButton, CheckOutButton, Container, FormRow,
} from '../../../components';
import { visitOptions, visitStatuses, MUI_SPACING_UNIT as spacing } from '../../../constants';
import { VisitModel } from '../../../models';

class EditVisit extends Component {
  constructor(props) {
    super(props);
    this.discharge = this.discharge.bind(this);
    this.checkOut = this.checkOut.bind(this);
  }

  state = {
    checkIn: false,
    action: 'new',
    patient: {},
    visitModel: new VisitModel(),
    loading: true,
    patientModel: {},
    selectedTab: 'vitals',
  }

  componentWillMount() {
    const { patientId, id } = this.props.match.params;
    this.props.initVisit({ patientId, id });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  componentWillUnmount() {
    const { visitModel } = this.state;
    if (visitModel) visitModel.off('change');
  }

  onCloseModal() {
    this.props.resetSaved();
    // const visitSaved = false;
    // this.setState({ visitSaved });
  }

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  handleUserInput = (e, field) => {
    const { visitModel } = this.state;
    if (typeof field !== 'undefined') {
      visitModel.set(field, e, { silent: true });
    } else {
      const { name } = e.target;
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      visitModel.set(name, value, { silent: true });
    }
    this.setState({ visitModel });
  }

  discharge = () => {
    const { visitModel, patientModel } = this.state;
    visitModel.set('status', visitStatuses.DISCHARGED);
    if (visitModel.get('endDate') === null || visitModel.get('endDate') === '') visitModel.set('endDate', moment());
    patientModel.set('admitted', false);
    this.submitForm(false);
  }

  checkOut = () => {
    const { visitModel } = this.state;
    visitModel.set('status', visitStatuses.DISCHARGED);
    visitModel.set('endDate', moment());
    this.submitForm(false);
  }

  handleChange(props = this.props) {
    let updates = {};
    const {
      patient, visit, action, loading,
    } = props;
    if (this.props.match.path.indexOf('checkin') !== -1) {
      updates.checkIn = true;
    }
    if (!loading) {
      // handle model's change
      if (visit.on) visit.on('change', () => this.forceUpdate());
      updates = Object.assign(updates, {
        patientModel: patient,
        patient: patient.toJSON(),
        visitModel: visit,
        action,
        loading,
      });
    }
    this.setState(updates);
  }

  submitForm(setStatus = true) {
    const { action, patientModel, visitModel } = this.state;
    this.props.submitForm({
      action, visitModel, patientModel, history: this.props.history, setStatus,
    });
  }

  renderTabs() {
    const { selectedTab } = this.state;
    return (
      <Tabs value={selectedTab} style={{ marginBottom: spacing }}>
        {
          [
            { value: 'vitals', label: 'Vitals' },
            { value: 'notes', label: 'Notes' },
            { value: 'procedures', label: 'Procedures' },
            { value: 'labs', label: 'Labs' },
            { value: 'reports', label: 'Reports' },
          ]
            .map(({ label, value }) => (
              <Tab
                key={value}
                style={{ minWidth: 'auto' }}
                label={label}
                value={value}
                onClick={() => this.changeTab(value)}
              />
            ))
        }
      </Tabs>
    );
  }

  renderTabsContent() {
    const { selectedTab, visitModel, patientModel } = this.state;
    switch (selectedTab) {
      default:
        return null;
      case 'vitals':
        return <Vitals visitModel={visitModel} />;
      case 'notes':
        return (
          <Notes
            parentModel={visitModel}
            patientModel={patientModel}
          />
        );
      case 'procedures':
        return (
          <Procedures
            history={this.props.history}
            visitModel={visitModel}
            patientModel={patientModel}
          />
        );
      case 'labs':
        return (
          <LabRequests
            history={this.props.history}
            parentModel={visitModel}
            patientSex={patientModel.get('sex')}
          />
        );
      case 'reports':
        return 'Reports';
    }
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const {
      checkIn,
      action,
      patientModel,
      patient,
      visitModel,
    } = this.state;
    const { attributes: form } = visitModel;
    return (
      <React.Fragment>
        <TopBar
          title={checkIn ? 'Patient Check In' : `${capitalize(action)} Visit`}
          subTitle={action === 'new' ? form.status : null}
        />
        <Container>
          <TopRow patient={patient} />

          {action !== 'new'
            && (
              <Grid container spacing={8} style={{ paddingBottom: 16 }}>
                <Grid item xs>
                  <Diagnosis parentModel={visitModel} patientModel={patientModel} />
                  <Procedure patientModel={patientModel} />
                  <OperativePlan
                    parentModel={visitModel}
                    patientId={patientModel.id}
                    history={this.props.history}
                  />
                </Grid>
                <Grid item xs>
                  <Diagnosis parentModel={visitModel} patientModel={patientModel} showSecondary />
                  <Allergy patientModel={patientModel} />
                  <OperationReport
                    parentModel={visitModel}
                    patientId={patientModel.id}
                    history={this.props.history}
                  />
                </Grid>
              </Grid>
            )
          }

          <form
            id="visitForm"
            onSubmit={(e) => {
              e.preventDefault();
              this.submitForm();
            }}
          >
            <Grid
              container
              spacing={spacing * 2}
              style={{ paddingTop: spacing * 2 }}
            >
              <FormRow>
                <DateInput
                  label={form.visitType !== 'admission' ? 'Check-in' : 'Admission Date'}
                  name="startDate"
                  value={form.startDate}
                  onChange={this.handleUserInput}
                  required
                />
                {form.visitType === 'admission'
                  && (
                    <DateInput
                      label="Discharge Date"
                      name="endDate"
                      value={form.endDate}
                      onChange={this.handleUserInput}
                    />
                  )
                }
                <TextInput
                  name="location"
                  label="Location"
                  value={form.location}
                  onChange={this.handleUserInput}
                />
              </FormRow>
              <FormRow>
                <SelectInput
                  options={visitOptions}
                  label="Visit Type"
                  name="visitType"
                  value={form.visitType}
                  onChange={(value) => this.handleUserInput(value, 'visitType')}
                  disabled={action === 'edit'}
                />
                <TextInput
                  name="examiner"
                  label="Doctor/Nurse"
                  value={form.examiner}
                  onChange={this.handleUserInput}
                />
              </FormRow>
              <FormRow>
                <TextInput
                  label="Reason For Visit"
                  name="reasonForVisit"
                  value={form.reasonForVisit}
                  onChange={this.handleUserInput}
                  multiline
                  rows="3"
                />
              </FormRow>
              {action === 'edit'
                && (
                  <Grid
                    container
                    spacing={8}
                    style={{ paddingTop: spacing * 3 }}
                  >
                    { this.renderTabs() }
                    <Grid container>
                      { this.renderTabsContent() }
                    </Grid>
                  </Grid>
                )
              }
            </Grid>
            <BottomBar>
              <CancelButton
                to={`/patients/editPatient/${patient._id}`}
              />
              {action === 'new' && (
              <AddButton
                disabled={!visitModel.isValid()}
                type="submit"
                form="visitForm"
                can={{ do: 'create', on: 'visit' }}
              />
              )}
              {action !== 'new' && (
              <UpdateButton
                disabled={!visitModel.isValid()}
                type="submit"
                form="visitForm"
                can={{ do: 'update', on: 'visit' }}
              />
              )}
              {form.status === visitStatuses.ADMITTED
                && (
                <DischargeButton
                  onClick={this.discharge}
                  can={{ do: 'update', on: 'visit', field: 'status' }}
                />
                )
              }
              {form.status === visitStatuses.CHECKED_IN
                && (
                <CheckOutButton
                  onClick={this.checkOut}
                  can={{ do: 'update', on: 'visit', field: 'status' }}
                />
                )
              }
            </BottomBar>
          </form>
        </Container>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {
    patient, visit, action, loading, error,
  } = state.patients;
  const mappedProps = {
    patient, action, loading, error,
  };
  if (visit instanceof VisitModel) mappedProps.visit = visit;
  return mappedProps;
}

const { visit: visitActions } = actions;
const { initVisit, submitForm, resetSaved } = visitActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  initVisit: (params) => dispatch(initVisit(params)),
  submitForm: (params) => dispatch(submitForm(params)),
  resetSaved: (params) => dispatch(resetSaved(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditVisit);
