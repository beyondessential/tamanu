import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { Link } from 'react-router-dom';

import { Preloader } from '../../../components';
import actions from '../../../actions/patients';
import Allergy from '../components/Allergy';
import Diagnosis from '../components/Diagnosis';
import Procedure from '../components/Procedure';
import OperativePlan from '../components/OperativePlan';
import History from './History';
import General from './General';
import Photos from './Photos';
import Appointments from './Appointments';
import Visits from './Visits';
import Medication from './Medication';
import Imaging from './Imaging';
import Labs from './Labs';
import Programs from './Programs';
import Pregnancy from './Pregnancy';
import TopRow from '../components/TopRow';

// import Serializer from '../../../utils/form-serialize';
import { PatientModel, AllergyModel } from '../../../models';

const classNames = require('classnames');

class EditPatient extends Component {
  state = {
    patient: {},
    loading: true,
    patientModel: {},
    selectedTab: '',
  }

  componentDidMount() {
    const { id } = this.props.match.params;
    this.props.fetchPatient({ id });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  // componentWillUnmount() {
  //   patientModel.off('change', this.handleChange);
  // }

  handleChange(props = this.props) {
    let updates = {};
    const { patient, action, loading, saved } = props;
    if (!loading) {
      // handle model's change
      // visit.on('change', () => this.forceUpdate());
      updates = Object.assign(updates, {
        patientModel: patient,
        patient: patient.toJSON({ relations: true }),
        action,
        loading,
      });
    }
    this.setState(updates);
  }

  // handleChange = () => {
  //   const patient = patientModel.toJSON({ relations: true });
  //   const procedures = patientModel.getProcedures();
  //   this.setState({ patient, procedures });
  // }

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  updatePatient = (patient) => {
    const { patientModel } = this.state;
    const { history } = this.props;
    const updatedPatient = patient;
    updatedPatient.birthday = moment(this.props.updatedBirthday).format('YYYY-MM-DD');
    updatedPatient.referredDate = moment(this.props.updatedReferredDate).format('YYYY-MM-DD');
    patientModel.set(updatedPatient);
    if (patientModel.isValid()) {
      patientModel.save(null, {
        // success: (model, response) => {
        success: () => {
          history.push('/patients');
        },
        // error: (model, response) => {
        error: () => { }
      });
    }
  }

  render() {
    const { loading } = this.state;
    if (loading) return <Preloader />; // TODO: make this automatic

    const { selectedTab, patient, patientModel } = this.state;
    const { history } = this.props;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              View Patient
            </span>
          </div>
          <div className="create-container">
            <div className="form">
              <div className="columns">
                <div className="column">
                  <TopRow patient={patient} />
                  <div className="columns border-bottom">
                    <div className="column">
                      <Diagnosis model={patientModel} />
                      <Procedure model={patientModel} />
                      <OperativePlan model={patientModel} />
                    </div>
                    <div className="column">
                      <Diagnosis model={patientModel} showSecondary />
                      <Allergy model={patientModel} />
                    </div>
                  </div>
                  <div className="columns">
                    <div className="column">
                      <div className="tabs">
                        <ul>
                          <li className={classNames(selectedTab === '' || selectedTab === 'history' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('history')}>History</a></li>
                          <li className={classNames(selectedTab === 'general' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('general')}>General</a></li>
                          <li className={classNames(selectedTab === 'photos' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('photos')}>Photos</a></li>
                          <li className={classNames(selectedTab === 'appointment' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('appointment')}>Appointments</a></li>
                          <li className={classNames(selectedTab === 'visit' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('visit')}>Visits</a></li>
                          <li className={classNames(selectedTab === 'medication' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('medication')}>Medication</a></li>
                          <li className={classNames(selectedTab === 'imaging' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('imaging')}>Imaging</a></li>
                          <li className={classNames(selectedTab === 'labs' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('labs')}>Labs</a></li>
                          {patient.sex === 'female' && <li className={classNames(selectedTab === 'pregnancy' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('pregnancy')}>Pregnancy</a></li>}
                          <li className={classNames(selectedTab === 'programs' ? 'is-active selected' : '')}><a onClick={() => this.changeTab('programs')}>Programs</a></li>
                        </ul>
                      </div>
                      <div className="tab-content">
                        {(selectedTab === '' || selectedTab === 'history') &&
                          <div className="column">
                            <History
                              history={history}
                              model={patientModel}
                            />
                          </div>
                        }
                        {selectedTab === 'general' &&
                          <General patient={patient} />
                        }
                        {selectedTab === 'photos' &&
                          <div className="column">
                            <Photos />
                          </div>
                        }
                        {selectedTab === 'appointment' &&
                          <div className="column">
                            <Appointments />
                          </div>
                        }
                        {selectedTab === 'visit' &&
                          <div className="column">
                            <Visits
                              history={history}
                              patient={patient}
                              model={patientModel}
                            />
                          </div>
                        }
                        {selectedTab === 'medication' &&
                          <div className="column">
                            <Medication />
                          </div>
                        }
                        {selectedTab === 'imaging' &&
                          <div className="column">
                            <Imaging />
                          </div>
                        }
                        {selectedTab === 'labs' &&
                          <div className="column">
                            <Labs />
                          </div>
                        }
                        {selectedTab === 'programs' &&
                          <div className="column">
                            <Programs />
                          </div>
                        }
                        {selectedTab === 'pregnancy' && patient.sex === 'female' &&
                          <div className="column">
                            <Pregnancy
                              history={history}
                              patient={patient}
                              model={patientModel}
                            />
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                  <div className={`column has-text-right ${selectedTab === 'general' ? 'is-hidden' : ''}`}>
                    <Link className="button is-danger cancel" to="/patients">Return</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
  const { patient, action, loading, saved, error } = state.patients;
  return { patient, action, loading, saved, error };
}

const { patient: patientActions } = actions;
const { fetchPatient, savePatient } = patientActions;
const mapDispatchToProps = dispatch => ({
  fetchPatient: (params) => dispatch(fetchPatient(params)),
  savePatient: (params) => dispatch(savePatient(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditPatient);
