import React, { Component } from 'react';
import { connect } from 'react-redux';
import Select from 'react-select';
import moment from 'moment';
import { capitalize } from 'lodash';

import TopRow from '../components/TopRow';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import Procedure from '../components/Procedure';
import OperativePlan from '../components/OperativePlan';
import LabRequests from '../components/LabRequests';
import Vitals from './Vitals';
import Notes from './Notes';
import Procedures from './Procedures';
import actions from '../../../actions/patients';
import { Preloader, InputGroup, DatepickerGroup, TopBar,
          AddButton, UpdateButton, CancelButton,
          DischargeButton, CheckOutButton } from '../../../components';
import { visitOptions, visitStatuses } from '../../../constants';
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
    selectedTab: '',
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

  handleChange(props = this.props) {
    let updates = {};
    const { patient, visit, action, loading } = props;
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

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  onCloseModal() {
    this.props.resetSaved();
    // const visitSaved = false;
    // this.setState({ visitSaved });
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

  submitForm(setStatus = true) {
    const { action, patientModel, visitModel } = this.state;
    this.props.submitForm({ action, visitModel, patientModel, history: this.props.history, setStatus });
  }

  renderTabs() {
    const { selectedTab } = this.state;
    return [
      { value: 'vitals', label: 'Vitals' },
      { value: 'notes', label: 'Notes' },
      { value: 'procedures', label: 'Procedures' },
      { value: 'labs', label: 'Labs' },
      { value: 'reports', label: 'Reports' },
    ]
    .map(item => (
      <li
        key={ item.value }
        className={selectedTab === item.value ? 'is-active selected' : ''}
      >
        <a onClick={() => this.changeTab(item.value)}>{ item.label }</a>
      </li>
    ));
  }

  renderTabsContent() {
    const { selectedTab, visitModel, patientModel } = this.state;

    return (<React.Fragment>
      {(selectedTab === '' || selectedTab === 'vitals') &&
        <div className="column">
          <Vitals visitModel={visitModel} />
        </div>}
      {selectedTab === 'notes' &&
        <div className="column">
          <Notes
            parentModel={visitModel}
            patientModel={patientModel}
          />
        </div>}
      {selectedTab === 'procedures' &&
        <div className="column">
          <Procedures
            history={this.props.history}
            visitModel={visitModel}
            patientModel={patientModel}
          />
        </div>}
      {selectedTab === 'labs' &&
        <LabRequests
          history={this.props.history}
          parentModel={visitModel}
          patientSex={patientModel.get('sex')}
        />
      }
      {selectedTab === 'reports' &&
        <div className="column">Reports</div>}
    </React.Fragment>);
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
      <div>
        <div className="create-content">
          <TopBar
            title={checkIn ? 'Patient Check In' : `${capitalize(action)} Visit`} />
          <div className="create-container">
            <div className="form">
              <form
                id="visitForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  this.submitForm();
                }}
              />
              <div className="columns m-b-0">
                <div className="column p-t-0">
                  <div className="column visit-header">
                    <span>Visit Information</span>
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <TopRow patient={patient} />
                  {action !== 'new' &&
                    <div className="columns border-bottom">
                      <div className="column">
                        <Diagnosis parentModel={visitModel} patientModel={patientModel} />
                        <Procedure patientModel={patientModel} />
                        <OperativePlan patientModel={patientModel} history={this.props.history} />
                      </div>
                      <div className="column">
                        <Diagnosis parentModel={visitModel} patientModel={patientModel} showSecondary />
                        <Allergy patientModel={patientModel} />
                      </div>
                    </div>
                  }
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <DatepickerGroup
                    label={form.visitType !== 'admission' ? 'Check-in' : 'Admission Date'}
                    name="startDate"
                    labelClass="header"
                    showTimeSelect
                    todayAsDefault
                    value={form.startDate}
                    onChange={this.handleUserInput}
                    required
                  />
                </div>
                <div className={`column is-4 ${form.visitType !== 'admission' ? 'is-hidden' : ''}`}>
                  <DatepickerGroup
                    label="Discharge Date"
                    name="endDate"
                    labelClass="header"
                    showTimeSelect
                    todayAsDefault={false}
                    value={form.endDate}
                    onChange={this.handleUserInput}
                  />
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="location"
                    label="Location"
                    value={form.location}
                    onChange={this.handleUserInput}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column is-4">
                  <div className="column">
                    <span className="header">
                      Visit Type <span className="isRequired">*</span>
                    </span>
                    <Select
                      options={visitOptions}
                      simpleValue
                      name="visitType"
                      value={form.visitType}
                      onChange={(value) => this.handleUserInput(value, 'visitType')}
                      disabled={action === 'edit'}
                    />
                  </div>
                </div>
                <div className={`column is-4 ${action === 'new' ? 'is-hidden' : ''}`}>
                  <div className="column">
                    <span className="header">
                      Visit Status
                    </span>
                    <span className="is-block p-t-3">{form.status}</span>
                  </div>
                </div>
                <div className="column is-4">
                  <InputGroup
                    name="examiner"
                    label="Doctor/Nurse"
                    value={form.examiner}
                    onChange={this.handleUserInput}
                  />
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="column">
                    <span className="header">
                      Reason For Visit
                    </span>
                    <textarea
                      className="textarea"
                      name="reasonForVisit"
                      value={form.reasonForVisit}
                      onChange={this.handleUserInput}
                    />
                  </div>
                </div>
              </div>
              {action === 'edit' &&
                <div className="columns">
                  <div className="column">
                    <div className="tabs">
                      <ul>
                        { this.renderTabs() }
                      </ul>
                    </div>
                    <div className="tab-content">
                      { this.renderTabsContent() }
                    </div>
                  </div>
                </div>
              }
              <div className="column has-text-right">
                <CancelButton
                  to={`/patients/editPatient/${patient._id}`} />
                {action === 'new' && <AddButton
                                      disabled={!visitModel.isValid()}
                                      type="submit"
                                      form="visitForm"
                                      can={{ do: 'create', on: 'visit' }} />}
                {action !== 'new' && <UpdateButton
                                      disabled={!visitModel.isValid()}
                                      type="submit"
                                      form="visitForm"
                                      can={{ do: 'update', on: 'visit' }} />}
                {form.status === visitStatuses.ADMITTED &&
                  <DischargeButton
                    onClick={this.discharge}
                    can={{ do: 'update', on: 'visit', field: 'status' }} />
                }
                {form.status === visitStatuses.CHECKED_IN &&
                  <CheckOutButton
                    onClick={this.checkOut}
                    can={{ do: 'update', on: 'visit', field: 'status' }} />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, visit, action, loading, error } = state.patients;
  const mappedProps = { patient, action, loading, error };
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
