import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import Select from 'react-select';
import moment from 'moment';
import { capitalize, isEmpty, clone } from 'lodash';

import TopRow from '../components/TopRow';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import Procedure from '../components/Procedure';
import OperativePlan from '../components/OperativePlan';
import Vitals from './Vitals';
import Notes from './Notes';
import Procedures from './Procedures';
import actions from '../../../actions/patients';
import { Preloader, InputGroup, DatepickerGroup, Modal } from '../../../components';
import { visitOptions, visitStatuses } from '../../../constants';

const classNames = require('classnames');

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
    visitModel: {},
    loading: true,
    patientModel: {},
    visitSaved: false,
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
    visitModel.off('change');
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
      if (action === 'new') {
        const diagnoses = visit.get('diagnoses');
        patient.attributes.diagnoses.models.forEach(model => diagnoses.add(model)); // visit.set('diagnoses', patient.attributes.diagnoses);
      }
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

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const {
      checkIn,
      action,
      patientModel,
      patient,
      visitModel,
      error,
      visitSaved,
      selectedTab,
    } = this.state;
    console.log('-visitModel-', visitModel);
    const { attributes: form } = visitModel;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>{checkIn ? 'Patient Check In' : `${capitalize(action)} Visit`}</span>
          </div>
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
                  <div className="columns border-bottom">
                    <div className="column">
                      <Diagnosis model={patientModel} />
                      <Procedure model={patientModel} />
                      <OperativePlan model={patientModel} history={this.props.history} />
                    </div>
                    <div className="column">
                      <Diagnosis model={patientModel} showSecondary />
                      <Allergy model={patientModel} />
                    </div>
                  </div>
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

              {/* <div className="columns">
                <div className="column is-4">
                  <InputGroup
                    name="finalDignosis"
                    label="Final/Billing Diagnosis"
                    onChange={this.handleUserInput}
                  />
                </div>
              </div> */}

              {action === 'edit' &&
                <div className="columns">
                  <div className="column">
                    <div className="tabs">
                      <ul>
                        <li className={classNames(selectedTab === '' || selectedTab === 'vitals' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('vitals')}>Vitals</a></li>
                        <li className={classNames(selectedTab === 'notes' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('notes')}>Notes</a></li>
                        <li className={classNames(selectedTab === 'procedures' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('procedures')}>Procedures</a></li>
                        <li className={classNames(selectedTab === 'reports' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('reports')}>Reports</a></li>
                      </ul>
                    </div>
                    <div className="tab-content">
                      {(selectedTab === '' || selectedTab === 'vitals') &&
                        <div className="column">
                          <Vitals
                            model={visitModel}
                          />
                        </div>
                      }
                      {selectedTab === 'notes' &&
                        <div className="column">
                          <Notes
                            model={visitModel}
                            patientModel={patientModel}
                          />
                        </div>
                      }
                      {selectedTab === 'procedures' &&
                        <div className="column">
                          <Procedures
                            history={this.props.history}
                            model={visitModel}
                            patientModel={patientModel}
                          />
                        </div>
                      }
                      {selectedTab === 'reports' &&
                        <div className="column">Reports</div>
                      }
                    </div>
                  </div>
                </div>
              }
              <div className="column has-text-right">
                <Link className="button is-danger cancel" to={`/patients/editPatient/${patient._id}`}>Return</Link>
                <button className="button is-primary cancel" type="submit" form="visitForm">{action === 'new' ? 'Add' : 'Update'}</button>
                {form.status === visitStatuses.ADMITTED &&
                  <button className="button is-primary" onClick={this.discharge} type="button">
                    <i className="fa fa-sign-out" /> Discharge
                  </button>
                }
                {form.status === visitStatuses.CHECKED_IN &&
                  <button className="button is-primary" onClick={this.checkOut} type="button">
                    <i className="fa fa-sign-out" /> Check-out
                  </button>
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
  return { patient, visit, action, loading, error };
}

const { visit: visitActions } = actions;
const { initVisit, submitForm, resetSaved } = visitActions;
const mapDispatchToProps = (dispatch, ownProps) => ({
  initVisit: (params) => dispatch(initVisit(params)),
  submitForm: (params) => dispatch(submitForm(params)),
  resetSaved: (params) => dispatch(resetSaved(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditVisit);
