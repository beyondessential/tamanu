import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { Link } from 'react-router-dom';

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
    selectedTab: '',
    patient: this.props.model.attributes,
    procedures: [],
  }

  async componentDidMount() {
    const { id } = this.props.match.params;
    this.props.model.on('render', this.handleChange);
    this.props.model.set({ _id: id });
    await this.props.model.fetch({ relations: true });
    this.props.model.trigger('render');
  }

  componentWillReceiveProps(newProps) {
    console.log('_componentWillReceiveProps_', newProps);
  }

  componentWillUnmount() {
    this.props.model.off('render', this.handleChange);
  }

  handleChange = () => {
    const patient = this.props.model.toJSON({ relations: true });
    const procedures = this.props.model.getProcedures();
    this.setState({ patient, procedures });
  }

  changeTab = (tabName) => {
    this.setState({ selectedTab: tabName });
  }

  updatePatient = (patient) => {
    const updatedPatient = patient;
    updatedPatient.birthday = moment(this.props.updatedBirthday).format('YYYY-MM-DD');
    updatedPatient.referredDate = moment(this.props.updatedReferredDate).format('YYYY-MM-DD');
    this.props.model.set(updatedPatient);
    if (this.props.model.isValid()) {
      this.props.model.save(null, {
        // success: (model, response) => {
        success: () => {
          this.props.history.push('/patients');
        },
        // error: (model, response) => {
        error: () => { }
      });
    }
  }

  render() {
    const { selectedTab, patient, procedures } = this.state;
    const { history } = this.props;
    return (
      <div>
        <div className="create-content">
          <div className="create-top-bar">
            <span>
              Edit Patient
            </span>
          </div>
          <div className="create-container">
            <div className="form">
              <div className="columns">
                <div className="column">
                  <TopRow patient={patient} />
                  <div className="columns border-bottom">
                    <div className="column">
                      <Diagnosis model={this.props.model} />
                      <Procedure model={this.props.model} />
                      <OperativePlan model={this.props.model} />
                    </div>
                    <div className="column">
                      <Diagnosis model={this.props.model} showSecondary />
                      <Allergy model={this.props.model} />
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
                            <History history={history} />
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
                            <Visits model={this.props.model} />
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
                            <Pregnancy patient={patient} model={this.props.model} history={this.props.history} />
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
  const { onePatient, updatedBirthday, updatedReferredDate } = state.patients;
  return {
    patient: onePatient,
    updatedBirthday,
    updatedReferredDate
  };
}

const mapDispatchToProps = () => ({
  model: new PatientModel(),
  allergyModel: new AllergyModel(),
});

export default connect(mapStateToProps, mapDispatchToProps)(EditPatient);
