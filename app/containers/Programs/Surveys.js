import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isEmpty, capitalize } from 'lodash';
import Select from 'react-select';
import { Colors, pageSizes } from '../../constants';
import actions from '../../actions/programs';
import { Preloader, Modal } from '../../components';

const { surveys: surveysActions } = actions;
const { initSurveys } = surveysActions;

class Surveys extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.selectModule = this.selectModule.bind(this);
  }

  state = {
    patient: {},
    program: {},
    availableSurveys: [],
    completedSurveys: [],
    modules: [],
    moduleSelected: '',
    showMessage: false,
    message: {
      header: '',
      text: '',
    }
  }

  componentDidMount() {
    const { patientId, programId } = this.props.match.params;
    this.props.initSurveys({ patientId, programId });
  }

  componentWillReceiveProps(newProps) {
    this.handleChange(newProps);
  }

  async handleChange(props = {}) {
    if (isEmpty(props)) props = this.props;
    const {
      patient: patientModel,
      program: programModel,
      availableSurveys,
      completedSurveys,
      modules,
      loading
    } = props;

    if (!loading) {
      this.setState({
        patient: patientModel.toJSON(),
        program: programModel.toJSON(),
        availableSurveys,
        completedSurveys,
        modules,
      });
    }
  }

  selectModule = (value) => {
    this.setState({ moduleSelected: value });
  }

  gotoSurvey = (surveyId) => {
    const { patientId, programId } = this.props.match.params;
    const { program, moduleSelected } = this.state;
    let valid = true;
    if (program.programType !== 'direct' && moduleSelected === '') {
      valid = false;
      const message = {
        header: `${capitalize(program.programType)} is required!`,
        text: capitalize(`Please select a ${program.programType} first`)
      };
      this.setState({ showMessage: true, message });
    }
    if (valid) {
      const url = program.programType === 'direct' ?
                    `/programs/${programId}/${patientId}/surveys/${surveyId}` :
                    `/programs/${programId}/${patientId}/surveys/${surveyId}/module/${moduleSelected}`;
      this.props.history.push(url);
    }
  }

  viewCompleted(listing, surveyId, responseId) {
    const { patientId, programId } = this.props.match.params;
    const url = listing ? `/programs/${programId}/${patientId}/${surveyId}/responses` : `/programs/${patientId}/${surveyId}/response/${responseId}`;
    this.props.history.push(url);
  }

  goBack() {
    const { programId } = this.props.match.params;
    this.props.history.push(`/programs/${programId}/patients`);
  }

  onCloseModal() {
    const showMessage = false;
    this.setState({ showMessage });
  }

  render() {
    const { loading } = this.props;
    if (loading) return <Preloader />;

    const {
      patient,
      program,
      modules,
      moduleSelected,
      availableSurveys,
      completedSurveys,
      showMessage,
      message,
    } = this.state;
    return (
      <div>
        <div className="content">
          <div className="view-top-bar">
            <span>{program.name}</span>
          </div>
          <div className="details">
            <div className="pregnancy-top p-l-10">
              <div className="columns">
                <div className="column pregnancy-name is-7">
                  <span className="pregnancy-name-title">
                    Patient
                  </span>
                  <span className="pregnancy-name-details">
                    {`${patient.firstName} ${patient.lastName}`}
                  </span>
                </div>

                {program.programType !== 'direct' &&
                  <div className="column is-5">
                    <div className="columns">
                      <div className="column pregnancy-name is-narrow is-size-5">
                        {capitalize(program.programType)}
                      </div>
                      <div className="column is-8">
                        <Select
                          options={modules}
                          simpleValue
                          name="moduleType"
                          value={moduleSelected}
                          onChange={this.selectModule}
                          required
                        />
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
            <div className="columns">
              <div className="column pregnancy-button-details m-l-10">
                <div className="pregnancy-options-title is-size-5 has-text-weight-semibold">Forms available</div>
                {!availableSurveys.length && <div className="p-t-10">No forms available</div>}
                {availableSurveys.length > 0 && availableSurveys.map(survey => {
                  return (
                    <div className="button-details" key={survey._id}>
                      <button className="button is-primary pregnancies-button " onClick={() => this.gotoSurvey(survey._id)}>{survey.name}</button>
                    </div>
                  );
                })}
              </div>
              {completedSurveys.length > 0 &&
                <div className="column pregnancy-button-details">
                  <div className="pregnancy-options-title">Previously Submitted</div>
                  {completedSurveys.map(survey => {
                    return (
                      <div className="button-details" key={survey._id}>
                        <button className="button is-info pregnancies-button " onClick={() => this.viewCompleted(survey.canRedo, survey._id)}>{`${survey.name} (${survey.count})`}</button>
                      </div>
                    );
                  })}
                </div>
              }
            </div>
            <div className="bottom-buttons p-l-10">
              <button className="button is-danger question-finish-button" onClick={this.goBack.bind(this)}>
                <i className="fa fa-chevron-left" /> Back
              </button>
            </div>
          </div>
        </div>
        <Modal
          isVisible={showMessage}
          onClose={() => this.onCloseModal()}
          headerTitle={message.header}
          contentText={message.text}
          little
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { patient, program, modules, availableSurveys, completedSurveys, loading } = state.programs;
  return { patient, program, modules, availableSurveys, completedSurveys, loading };
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  initSurveys: (model) => dispatch(initSurveys(model)),
});
// , questions, startTime
export default connect(mapStateToProps, mapDispatchToProps)(Surveys);
