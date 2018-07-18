import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { clone } from 'lodash';

// import { fetchPatients, deletePatient } from '../../actions/patients';
import { Colors, pageSizes } from '../../constants';
import { PatientModel, ProgramModel } from '../../models';

class Surveys extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  state = {
    patient: {},
    program: {},
    surveys: []
  }

  async componentWillMount() {
    console.log('componentWillMount');
    const { patientId, programId } = this.props.match.params;
    this.props.patientModel.on('change', this.handleChange);
    this.props.programModel.on('change', this.handleChange);

    this.props.patientModel.set({ _id: patientId });
    await this.props.patientModel.fetch();
    this.props.programModel.set({ _id: programId });
    await this.props.programModel.fetch({ relations: true });
  }

  componentWillUnmount() {
    this.props.patientModel.off('change');
    this.props.programModel.off('change');
  }

  async handleChange() {
    const patient = this.props.patientModel.toJSON();
    const program = this.props.programModel.toJSON();
    const surveys = this.props.programModel.get('surveys').toJSON();
    this.setState({ patient, program, surveys });
  }

  selectPatient = (patientId) => {
    const { programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/${patientId}/surveys`);
  }

  showAntenatal() {
    this.props.history.push('/programs/questionTable');
  }
  showGestantional() {
    this.props.history.push('/programs/questionsFirst');
  }
  showOnset() {
    this.props.history.push('/programs/pregnancyConfirm');
  }
  showPregnancy() {
    this.props.history.push('/programs/pregnancyConfirm');
  }

  render() {
    const { patient, program, surveys } = this.state;
    // console.log('render', surveys);

    return (
      <div className="content">
        <div className="view-top-bar">
          <span>{program.name}</span>
        </div>
        <div className="details">
          <div className="pregnancy-top">
            <div className="columns">
              <div className="column pregnancy-name">
                <span className="pregnancy-name-title">
                  Name
                </span>
                <span className="pregnancy-name-details">
                  {`${patient.firstName} ${patient.lastName}`}
                </span>
              </div>
              <div className="column pregnancy-estimate">
                <span className="pregnancy-estimate-text">
                  Estimate date of conception:
                </span>
                <button className="button is-primary estimate-add-button " onClick={this.showAntenatal.bind(this)}>+(Add)</button>
              </div>
            </div>
          </div>
          <div className="columns">
            <div className="column pregnancy-button-details">
              <div className="pregnancy-options-title">Pregnancy 3: Options</div>
              {surveys.map(survey => {
                return (
                  <div className="button-details" key={survey._id}>
                    <button className="button is-primary pregnancies-button " onClick={this.showAntenatal.bind(this)}>{survey.name}</button>
                  </div>
                );
              })}
            </div>
            <div className="column pregnancy-button-details">
              <div className="pregnancy-options-title">View previous visits</div>
              <div className="button-details">
                <button className="button is-info pregnancies-button " onClick={this.showAntenatal.bind(this)}>Patient reporting</button>
              </div>
              <div className="button-details">
                <button className="button is-warning pregnancies-button " onClick={this.showAntenatal.bind(this)}>Antenatal Visit 1</button>
              </div>
              <div className="button-details">
                <button className="button is-warning pregnancies-button " onClick={this.showAntenatal.bind(this)}>Antenatal Visit 2</button>
              </div>
              <div className="button-details">
                <button className="button is-warning pregnancies-button " onClick={this.showAntenatal.bind(this)}>Postnatal Visit 1</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

Surveys.defaultProps = {
  programModel: new ProgramModel(),
  patientModel: new PatientModel(),
  surveys: []
};

export default Surveys;
